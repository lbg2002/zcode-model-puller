#!/usr/bin/env python3
"""Opt-in Linux systemd maintenance for ZCode Model Puller.

Systemd timer -> root-owned maintenance launcher -> unprivileged ASAR builder ->
verified, root-only atomic installation.  Never run upstream or npm as root.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import pwd
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# These files are installed as a root-owned, immutable snapshot by `setup`.
HERE = Path(__file__).resolve().parent
LIB = Path('/usr/local/lib/zcode-model-puller-auto')
STATE_ROOT = Path('/var/lib/zcode-model-puller-auto')
CONFIG = Path('/etc/zcode-model-puller-auto.json')
UNIT_DIR = Path('/etc/systemd/system')
SERVICE = 'zcode-model-puller-auto.service'
TIMER = 'zcode-model-puller-auto.timer'
SERVICE_USER = 'zcode-puller'
SOURCE_FILES = ('auto_maintain.py', 'auto_builder.py', 'linux_installer.py', 'inject_tool.py', 'zcode-model-puller.js', 'zcode-theme-manager.js')


def say(message):
    print(message, flush=True)


def execute(command, **kw):
    return subprocess.run(list(map(str, command)), check=True, **kw)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as file:
        for block in iter(lambda: file.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


def asar_ready(file: Path) -> bool:
    """Quick structural validation without unpacking a large ASAR."""
    from linux_installer import ensure_expected_layout
    if not file.is_file() or file.stat().st_size < 1024:
        return False
    try:
        ensure_expected_layout(file)
        return True
    except (OSError, ValueError, KeyError, UnicodeError):
        return False


def snapshot_stable(file: Path, delay: int = 3) -> bool:
    if not asar_ready(file):
        return False
    before = file.stat()
    time.sleep(delay)
    after = file.stat()
    return (before.st_ino, before.st_mtime_ns, before.st_size) == (after.st_ino, after.st_mtime_ns, after.st_size) and asar_ready(file)


def no_symlink(path: Path):
    if path.is_symlink():
        raise RuntimeError(f'Refusing symbolic-link target: {path}')


def zcode_process_running(app: Path) -> bool:
    """Avoid swapping Electron's ASAR/native modules while the application is running."""
    app = app.resolve()
    try:
        for item in Path('/proc').iterdir():
            if not item.name.isdecimal():
                continue
            try:
                target = os.readlink(item / 'exe').removesuffix(' (deleted)')
                if Path(target).resolve().is_relative_to(app):
                    return True
            except (OSError, ValueError):
                continue
    except OSError:
        return False
    return False




def copy_native(source: Path, dest: Path) -> None:
    """Copy native files without accepting symlinks in privileged publication."""
    if not source.is_dir() or source.is_symlink():
        raise RuntimeError(f'Invalid unpacked source: {source}')
    # Electron packages can contain relative symlinks; copy preserving them and
    # reject absolute or parent-escaping symlinks before publication.
    for root, dirs, files in os.walk(source, followlinks=False):
        base = Path(root)
        for item in dirs + files:
            candidate = base / item
            if candidate.is_symlink():
                link = os.readlink(candidate)
                if Path(link).is_absolute() or not (candidate.parent / link).resolve().is_relative_to(source.resolve()):
                    raise RuntimeError(f'Unsafe unpacked module symlink: {candidate}')
    shutil.copytree(source, dest, symlinks=True)
    for root, dirs, files in os.walk(dest, followlinks=False):
        for candidate in [Path(root)] + [Path(root) / x for x in dirs + files]:
            if not candidate.is_symlink():
                os.chown(candidate, 0, 0)


def backup_pristine(resources: Path, hash_before: str):
    backup = STATE_ROOT / 'backups' / hash_before
    target = backup / 'app.asar'
    if not target.is_file():
        backup.mkdir(parents=True, exist_ok=True)
        partial = backup / 'app.asar.part'
        shutil.copy2(resources / 'app.asar', partial)
        if digest(partial) != hash_before:
            partial.unlink(missing_ok=True)
            raise RuntimeError('Original ZCode changed during backup')
        os.replace(partial, target)
        native = resources / 'app.asar.unpacked'
        if native.is_dir():
            copy_native(native, backup / 'app.asar.unpacked')
    if digest(target) != hash_before:
        raise RuntimeError('Pristine backup has invalid SHA256')
    say(f'Backed up pre-installation ZCode into {backup}')
    return backup


def publish_built(resources: Path, stage: Path, hash_before: str):
    """Publish validated build using fixed resource names, ASAR last."""
    from linux_installer import injected, theme_up_to_date
    fresh = stage / 'ZCode/resources/app.asar'
    fresh_native = stage / 'ZCode/resources/app.asar.unpacked'
    if not injected(fresh) or not theme_up_to_date(fresh):
        raise RuntimeError('Refusing to publish ASAR without model puller and theme manager')
    fresh_hash = digest(fresh)
    if fresh_hash == hash_before:
        raise RuntimeError('Build did not change ASAR')
    if digest(resources / 'app.asar') != hash_before:
        raise RuntimeError('ZCode changed during build; skipping this run')
    baseline = STATE_ROOT / 'backups' / hash_before / 'app.asar'
    if not baseline.is_file() or digest(baseline) != hash_before:
        raise RuntimeError('Verified pre-installation backup is required before publishing')
    baseline_was_injected = injected(baseline)

    nxt = resources / 'app.asar.puller-auto-next'
    next_native = resources / 'app.asar.unpacked.puller-auto-next'
    previous_native = resources / 'app.asar.unpacked.puller-auto-previous'
    live_native = resources / 'app.asar.unpacked'
    for p in (nxt, next_native, previous_native):
        if p.exists() or p.is_symlink():
            raise RuntimeError(f'Stale intermediate {p}; manual inspection needed')
    no_symlink(resources / 'app.asar')
    no_symlink(live_native)
    copied = False
    replaced_native = False
    published = False
    try:
        shutil.copyfile(fresh, nxt)
        os.chown(nxt, 0, 0)
        nxt.chmod(0o644)
        if digest(nxt) != fresh_hash:
            raise RuntimeError('Temporary published file failed checksum')
        if live_native.is_dir() and not fresh_native.is_dir():
            raise RuntimeError('Patched ASAR lost its native modules')
        if fresh_native.is_dir():
            copy_native(fresh_native, next_native)
            if live_native.is_dir():
                live_native.rename(previous_native)
                copied = True
            next_native.rename(live_native)
            replaced_native = True
        if digest(resources / 'app.asar') != hash_before:
            raise RuntimeError('Official ASAR changed before final publication')
        os.replace(nxt, resources / 'app.asar')
        published = True
    finally:
        if not published:
            if replaced_native:
                live_native.rename(next_native)
            if copied:
                previous_native.rename(live_native)
        if published and copied:
            shutil.rmtree(previous_native)
        nxt.unlink(missing_ok=True)
        if next_native.exists():
            shutil.rmtree(next_native)
    record = {'target': str(resources.parent), 'original_sha256': hash_before,
              'baseline_was_injected': baseline_was_injected,
              'installed_sha256': fresh_hash,
              'backup_dir': str(STATE_ROOT / 'backups' / hash_before)}
    statefile = STATE_ROOT / 'active.json'
    tempstate = statefile.with_suffix('.tmp')
    tempstate.write_text(json.dumps(record, indent=2) + '\n')
    os.replace(tempstate, statefile)
    say('✅ ZCode automatic injection installed; restart ZCode to load changes')


def restore_active():
    """Only revert the exact version recorded by this systemd installer."""
    require_root()
    if subprocess.run(['systemctl', 'is-active', '--quiet', SERVICE]).returncode == 0:
        raise RuntimeError('Maintenance service is running; retry restore after it finishes')
    from linux_installer import injected
    active = STATE_ROOT / 'active.json'
    if not active.is_file():
        raise RuntimeError('No automatic-installer restore state found')
    state = json.loads(active.read_text())
    resources = Path(state['target']) / 'resources'
    current = resources / 'app.asar'
    backup = Path(state['backup_dir'])
    pristine = backup / 'app.asar'
    if (digest(current) != state['installed_sha256'] or
            digest(pristine) != state['original_sha256'] or not injected(current)):
        raise RuntimeError('Version mismatch: refusing to restore an old version over a new one')
    next_asar = resources / 'app.asar.puller-auto-restore'
    next_native = resources / 'app.asar.unpacked.puller-auto-restore'
    old_native = resources / 'app.asar.unpacked.puller-auto-old'
    native = resources / 'app.asar.unpacked'
    if any(p.exists() or p.is_symlink() for p in (next_asar, next_native, old_native)):
        raise RuntimeError('Stale restore files exist; inspect before retrying')
    pristine_native = backup / 'app.asar.unpacked'
    moved = False
    new_moved = False
    published = False
    try:
        shutil.copy2(pristine, next_asar)
        os.chown(next_asar, 0, 0)
        next_asar.chmod(0o644)
        if digest(next_asar) != state['original_sha256']:
            raise RuntimeError('Backup restore checksum mismatch')
        if pristine_native.is_dir():
            copy_native(pristine_native, next_native)
        if native.is_dir():
            native.rename(old_native)
            moved = True
        if pristine_native.is_dir():
            next_native.rename(native)
            new_moved = True
        if digest(current) != state['installed_sha256']:
            raise RuntimeError('ZCode changed during restore')
        os.replace(next_asar, current)
        published = True
    finally:
        if not published:
            if new_moved:
                native.rename(next_native)
            if moved:
                old_native.rename(native)
        if published and moved:
            shutil.rmtree(old_native)
        next_asar.unlink(missing_ok=True)
        if next_native.exists():
            shutil.rmtree(next_native)
    active.unlink()
    # To keep ZCode pristine, disable automatic reinjection as part of restore.
    execute(['systemctl', 'disable', '--now', TIMER])
    say('✅ Restored exact pre-installation ZCode resources; automatic watcher disabled.')


def resolve_runuser() -> str:
    """Resolve root's account-switching executable independently of the worker PATH.

    Ubuntu normally installs runuser in /usr/sbin, which is intentionally absent
    from the unprivileged builder PATH. Pass an absolute executable path to Popen.
    """
    executable = shutil.which('runuser', path='/usr/sbin:/sbin:/usr/bin:/bin')
    if not executable:
        raise RuntimeError('Missing runuser (util-linux); expected /usr/sbin/runuser')
    return executable


def worker_env(home: Path, node_bin: str = ""):
    safe_path = (str(Path(node_bin)) + ":" if node_bin else "") + "/usr/local/bin:/usr/bin:/bin"
    # use system paths, not a possibly user-modified PATH from root's shell.
    return {'PATH': safe_path, 'HOME': str(home),
            'XDG_CACHE_HOME': str(home / '.cache'), 'npm_config_cache': str(home / '.npm'),
            'LANG': 'C.UTF-8'}


def run_once(config: dict):
    from linux_installer import injected, theme_up_to_date
    app = Path(config['zcode_path']).resolve(strict=True)
    resources = app / 'resources'
    src = resources / 'app.asar'
    if not src.is_file():
        say('ZCode is not installed; skip')
        return
    no_symlink(src)
    lockfile = STATE_ROOT / 'auto.lock'
    STATE_ROOT.mkdir(parents=True, exist_ok=True)
    with lockfile.open('w') as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            say('Another injection is running; skip')
            return
        if not snapshot_stable(src):
            say('ASAR is not stable/compatible; retry on next timer tick')
            return
        if injected(src) and theme_up_to_date(src):
            say('ZCode model puller + theme manager already installed; no action needed')
            return
        if zcode_process_running(app):
            say('ZCode is running; defer theme upgrade until the app exits')
            return
        binaries = worker_env(Path('/tmp'), config.get('node_bin', ''))['PATH']
        resolve_runuser()
        if any(shutil.which(x, path=binaries) is None for x in ('npx', 'node')):
            raise RuntimeError('Missing node/npx in watcher PATH; rerun install-auto-linux.sh install')
        # Throttle incompatible builds for the same unchanged application release.
        failed = STATE_ROOT / 'failure.json'
        signature = [src.stat().st_size, src.stat().st_mtime_ns]
        if failed.is_file():
            try:
                last = json.loads(failed.read_text())
                if last['signature'] == signature and time.time() - last['at'] < 3600:
                    say('Previous injection failed on this same build; retry deferred up to 1 hour')
                    return
            except (OSError, KeyError, ValueError, TypeError):
                pass
        source_hash = digest(src)
        try:
            _run_build_and_publish(resources, src, source_hash, config)
        except Exception as exc:
            temp = failed.with_suffix('.tmp')
            temp.write_text(json.dumps({'signature': signature, 'at': time.time(),
                                        'error': str(exc)[:2000]}) + '\n')
            os.replace(temp, failed)
            raise
        else:
            failed.unlink(missing_ok=True)


def _run_build_and_publish(resources: Path, src: Path, source_hash: str, config: dict):
    backup_pristine(resources, source_hash)
    account = pwd.getpwnam(SERVICE_USER)
    with tempfile.TemporaryDirectory(prefix='stage-', dir=STATE_ROOT) as temp:
        stage = Path(temp)
        shutil.copy2(src, stage / 'original.asar')
        if digest(stage / 'original.asar') != source_hash:
            raise RuntimeError('Source changed during staging')
        app_stage = stage / 'ZCode/resources'
        app_stage.mkdir(parents=True)
        shutil.move(stage / 'original.asar', app_stage / 'app.asar')
        live_native = resources / 'app.asar.unpacked'
        if live_native.is_dir():
            copy_native(live_native, app_stage / 'app.asar.unpacked')
        home = stage / 'home'
        home.mkdir()
        # Make all isolated staging data writable for a non-privileged builder.
        for root, dirs, files in os.walk(stage):
            for p in [Path(root)] + [Path(root) / x for x in dirs + files]:
                if not p.is_symlink():
                    os.chown(p, account.pw_uid, account.pw_gid)
        builder = LIB / 'auto_builder.py'
        say('Building and verifying as unprivileged zcode-puller system user...')
        build_env = worker_env(home, config.get('node_bin', ''))
        env_args = [f'{key}={value}' for key, value in build_env.items()]
        execute([resolve_runuser(), '-u', SERVICE_USER, '--', '/usr/bin/env',
                 *env_args, '/usr/bin/python3', str(builder), str(stage)],
                env=build_env, timeout=1800)
        publish_built(resources, stage, source_hash)

def require_root():
    if os.geteuid() != 0:
        raise RuntimeError('This action needs sudo')


def install_system(config):
    require_root()
    path = Path(config['zcode_path']).resolve()
    if str(path) == '/' or not (path / 'resources/app.asar').is_file():
        raise RuntimeError('Expected valid ZCode installation at --zcode-path')
    # Limit privileged target to /opt tree; do not permit arbitrary user paths.
    if not path.is_relative_to(Path('/opt')):
        raise RuntimeError('Only ZCode installations under /opt are supported by auto mode')
    try:
        account = pwd.getpwnam(SERVICE_USER)
    except KeyError:
        execute(['useradd', '--system', '--no-create-home', '--home-dir', '/nonexistent',
                 '--shell', '/usr/sbin/nologin', SERVICE_USER])
        account = pwd.getpwnam(SERVICE_USER)
    if (UNIT_DIR / SERVICE).exists():
        check = subprocess.run(['systemctl', 'is-active', '--quiet', SERVICE])
        if check.returncode == 0:
            raise RuntimeError('Wait until the maintenance service finishes before reinstalling the watcher')
        subprocess.run(['systemctl', 'stop', TIMER], check=False)
    node_bin = config.get('node_bin', '')
    if node_bin and (not Path(node_bin).is_absolute() or not Path(node_bin).is_dir()):
        raise RuntimeError('Node bin directory must be an existing absolute path')
    # Check access as the actual dedicated builder account, not the desktop user.
    check_path = worker_env(Path('/tmp'), node_bin)['PATH']
    for tool in ('node', 'npx'):
        execute([resolve_runuser(), '-u', SERVICE_USER, '--', '/usr/bin/env',
                 f'PATH={check_path}', tool, '--version'], timeout=20,
                stdout=subprocess.DEVNULL)
    LIB.mkdir(parents=True, exist_ok=True)
    for filename in SOURCE_FILES:
        src = HERE / filename
        if not src.is_file():
            raise RuntimeError('Missing source: ' + str(src))
        shutil.copyfile(src, LIB / filename) if src.resolve() != (LIB / filename).resolve() else None
        (LIB / filename).chmod(0o644)
        os.chown(LIB / filename, 0, 0)
    os.chown(LIB, 0, 0)
    LIB.chmod(0o755)
    STATE_ROOT.mkdir(parents=True, exist_ok=True)
    STATE_ROOT.chmod(0o711)  # allow dedicated worker to traverse into its own isolated stage
    node_bin = config.get('node_bin', '')
    if node_bin:
        node_path = Path(node_bin)
        if not node_path.is_absolute() or not node_path.is_dir():
            raise RuntimeError('Node bin directory must be an existing absolute path')
    CONFIG.write_text(json.dumps({'zcode_path': str(path), 'node_bin': node_bin}, indent=2) + '\n', encoding='utf-8')
    CONFIG.chmod(0o644)
    os.chown(CONFIG, 0, 0)
    unit = (f'[Unit]\nDescription=ZCode Model Puller automatic recovery\n'
            f'After=local-fs.target network-online.target\nWants=network-online.target\n'
            f'\n[Service]\nType=oneshot\nExecStart=/usr/bin/python3 {LIB}/auto_maintain.py run\n'
            f'TimeoutStartSec=35min\nNoNewPrivileges=yes\nPrivateTmp=yes\n')
    timer = (f'[Unit]\nDescription=Check ZCode for lost model puller injection\n\n'
             f'[Timer]\nOnBootSec=2min\nOnUnitInactiveSec=5min\n'
             f'AccuracySec=1min\nPersistent=true\nUnit={SERVICE}\n\n[Install]\nWantedBy=timers.target\n')
    (UNIT_DIR / SERVICE).write_text(unit, encoding='utf-8')
    (UNIT_DIR / TIMER).write_text(timer, encoding='utf-8')
    execute(['systemctl', 'daemon-reload'])
    execute(['systemctl', 'enable', '--now', TIMER])
    # Installing a fixed service snapshot is an explicit admin retry: clear the
    # previous build's failure throttle so fixes can be checked immediately.
    (STATE_ROOT / 'failure.json').unlink(missing_ok=True)
    say('✅ Automatic maintenance enabled (checks about every 5 minutes).')
    say('Check: systemctl list-timers ' + TIMER)
    say('Logs: journalctl -u ' + SERVICE + ' -n 80 --no-pager')


def uninstall_system():
    require_root()
    execute(['systemctl', 'disable', '--now', TIMER])
    for path in (UNIT_DIR / TIMER, UNIT_DIR / SERVICE, CONFIG):
        path.unlink(missing_ok=True)
    execute(['systemctl', 'daemon-reload'])
    say('Automatic watcher removed. ZCode injection and backups were not touched.')


def main():
    cli = argparse.ArgumentParser(description='Linux systemd auto-maintenance for ZCode Model Puller')
    cli.add_argument('action', choices=('install', 'run', 'status', 'remove', 'restore'))
    cli.add_argument('--zcode-path', default='/opt/ZCode')
    cli.add_argument('--node-bin', default='')
    a = cli.parse_args()
    if a.action == 'install':
        install_system({'zcode_path': a.zcode_path, 'node_bin': a.node_bin})
    elif a.action == 'remove':
        uninstall_system()
    elif a.action == 'restore':
        restore_active()
    elif a.action == 'status':
        execute(['systemctl', 'list-timers', '--all', TIMER])
        subprocess.run(['systemctl', 'status', TIMER, '--no-pager', '--lines=0'], check=False)
    else:
        require_root()
        run_once(json.loads(CONFIG.read_text(encoding='utf-8')))


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        say('❌ ' + str(error))
        sys.exit(1)

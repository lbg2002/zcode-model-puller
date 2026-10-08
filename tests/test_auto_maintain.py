import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('auto_maintain', ROOT / 'auto_maintain.py')
auto = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auto)


def fake_asar(path, patched=False, themed=False):
    tree = {'files': {'out': {'files': {
        'main': {'files': {'index.js': {'size': 10}}},
        'preload': {'files': {'index.cjs': {'size': 10}}},
        'renderer': {'files': {'index.html': {'size': 10}}},
    }}}}
    if patched:
        tree['files']['out']['files']['renderer']['files']['zcode-model-puller.js'] = {'size': 8}
    if themed:
        tree['files']['out']['files']['renderer']['files']['zcode-theme-manager.js'] = {'size': 8}
    payload = json.dumps(tree).encode()
    path.write_bytes(b'\0'*8 + len(payload).to_bytes(4,'little') + b'\0'*4 + payload + b'X'*1024)


class WatcherTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'resources').mkdir()
        (self.root / 'resources/app.asar.unpacked').mkdir()
        (self.root / 'resources/app.asar.unpacked/native.node').write_text('original')
        self.source = self.root / 'resources/app.asar'
        fake_asar(self.source)

    def test_detect_layout_and_stability(self):
        self.assertTrue(auto.asar_ready(self.source))
        self.assertTrue(auto.snapshot_stable(self.source, delay=0))
        self.source.write_text('corrupted')
        self.assertFalse(auto.asar_ready(self.source))

    def test_skip_currently_injected(self):
        fake_asar(self.source, True, themed=True)
        with patch.object(auto, 'STATE_ROOT', self.root / 'state'), \
             patch.object(auto, 'snapshot_stable', return_value=True), \
             patch('linux_installer.theme_up_to_date', return_value=True), \
             patch.object(auto, 'backup_pristine') as backup:
            auto.run_once({'zcode_path': str(self.root)})
            backup.assert_not_called()

    def test_upgrade_existing_model_puller_without_theme(self):
        fake_asar(self.source, patched=True, themed=False)
        with patch.object(auto, 'STATE_ROOT', self.root / 'state'), \
             patch.object(auto, 'snapshot_stable', return_value=True), \
             patch.object(auto.shutil, 'which', return_value='/usr/bin/node'), \
             patch.object(auto, '_run_build_and_publish') as build:
            auto.run_once({'zcode_path': str(self.root)})
            build.assert_called_once()

    def test_running_app_defers_upgrade(self):
        fake_asar(self.source, patched=True, themed=False)
        with patch.object(auto, 'STATE_ROOT', self.root / 'state'), \
             patch.object(auto, 'snapshot_stable', return_value=True), \
             patch.object(auto, 'zcode_process_running', return_value=True), \
             patch.object(auto, '_run_build_and_publish') as build:
            auto.run_once({'zcode_path': str(self.root)})
            build.assert_not_called()

    def test_content_addressed_backup(self):
        with patch.object(auto, 'STATE_ROOT', self.root / 'state'), patch.object(auto.os, 'chown'):
            original = auto.digest(self.source)
            backup = auto.backup_pristine(self.root / 'resources', original)
            self.assertEqual(auto.digest(backup / 'app.asar'), original)
            self.assertEqual((backup / 'app.asar.unpacked/native.node').read_text(), 'original')
            self.assertEqual(auto.backup_pristine(self.root / 'resources', original), backup)

    def test_publish_atomic_and_version_guard(self):
        stage = self.root / 'stage/ZCode/resources'
        stage.mkdir(parents=True)
        patched = stage / 'app.asar'
        fake_asar(patched, True, themed=True)
        (stage / 'app.asar.unpacked').mkdir()
        (stage / 'app.asar.unpacked/native.node').write_text('patched')
        official = auto.digest(self.source)
        with patch.object(auto, 'STATE_ROOT', self.root / 'state'), patch.object(auto.os, 'chown'):
            (self.root / 'state').mkdir()
            with patch('linux_installer.theme_up_to_date', return_value=True):
                with self.assertRaisesRegex(RuntimeError, 'changed during build'):
                    auto.publish_built(self.root / 'resources', stage.parent.parent, 'wrongsha')
            self.assertEqual((self.root / 'resources/app.asar.unpacked/native.node').read_text(), 'original')
            auto.backup_pristine(self.root / 'resources', official)
            with patch('linux_installer.theme_up_to_date', return_value=True):
                auto.publish_built(self.root / 'resources', stage.parent.parent, official)
            self.assertTrue(auto.asar_ready(self.source))
            self.assertEqual((self.root / 'resources/app.asar.unpacked/native.node').read_text(), 'patched')
            self.assertEqual(json.loads((self.root / 'state/active.json').read_text())['original_sha256'], official)

    def test_reject_unsafe_native_symlinks(self):
        source = self.root / 'native'
        source.mkdir()
        (source / 'link').symlink_to('/etc/passwd')
        with self.assertRaisesRegex(RuntimeError, 'Unsafe'):
            auto.copy_native(source, self.root / 'dest')

    def test_worker_environment(self):
        value = auto.worker_env(self.root, '/home/test/.nvm/bin')
        self.assertTrue(value['PATH'].startswith('/home/test/.nvm/bin:'))
        self.assertEqual(value['HOME'], str(self.root))

    def test_runuser_is_resolved_outside_worker_path(self):
        # Regression: on Ubuntu runuser lives in /usr/sbin, but the intentionally
        # restricted build environment does not have /usr/sbin in PATH.
        restricted = auto.worker_env(self.root)
        self.assertNotIn('/usr/sbin', restricted['PATH'].split(':'))
        with patch.object(auto.shutil, 'which', return_value='/usr/sbin/runuser') as which:
            self.assertEqual(auto.resolve_runuser(), '/usr/sbin/runuser')
            which.assert_called_once_with('runuser', path='/usr/sbin:/sbin:/usr/bin:/bin')

    def test_runuser_missing_has_actionable_error(self):
        with patch.object(auto.shutil, 'which', return_value=None):
            with self.assertRaisesRegex(RuntimeError, 'Missing runuser'):
                auto.resolve_runuser()

    def test_builder_uses_absolute_runuser_with_restricted_path(self):
        from types import SimpleNamespace

        store = self.root / 'state'
        store.mkdir()
        original_hash = auto.digest(self.source)
        with patch.object(auto, 'STATE_ROOT', store), \
             patch.object(auto, 'LIB', self.root / 'lib'), \
             patch.object(auto, 'backup_pristine'), \
             patch.object(auto, 'publish_built'), \
             patch.object(auto.os, 'chown'), \
             patch.object(auto.pwd, 'getpwnam', return_value=SimpleNamespace(pw_uid=42, pw_gid=42)), \
             patch.object(auto, 'resolve_runuser', return_value='/usr/sbin/runuser'), \
             patch.object(auto, 'execute') as execute:
            auto._run_build_and_publish(self.root / 'resources', self.source, original_hash, {})
            call = execute.call_args
            self.assertEqual(call.args[0][0], '/usr/sbin/runuser')
            self.assertNotIn('/usr/sbin', call.kwargs['env']['PATH'])

    def test_builder_never_runs_as_root(self):
        import sys
        sys.path.insert(0, str(ROOT))
        try:
            import auto_builder
            with patch.object(auto_builder.os, 'geteuid', return_value=0):
                with self.assertRaisesRegex(RuntimeError, 'never run as root'):
                    auto_builder.build(self.root)
        finally:
            sys.path.remove(str(ROOT))


if __name__ == '__main__':
    unittest.main()

class FailureAndRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.resources = self.root / 'ZCode/resources'
        self.resources.mkdir(parents=True)
        self.original = self.resources / 'app.asar'
        fake_asar(self.original)
        (self.resources / 'app.asar.unpacked').mkdir()
        (self.resources / 'app.asar.unpacked/lib.node').write_text('official')

    def test_failed_version_is_throttled(self):
        with patch.object(auto, 'STATE_ROOT', self.root / 'store'), \
             patch.object(auto, 'snapshot_stable', return_value=True), \
             patch.object(auto.shutil, 'which', return_value='/usr/bin/node'), \
             patch.object(auto, '_run_build_and_publish', side_effect=RuntimeError('test failure')) as build:
            with self.assertRaisesRegex(RuntimeError, 'test failure'):
                auto.run_once({'zcode_path': str(self.resources.parent)})
            self.assertTrue((self.root / 'store/failure.json').is_file())
            auto.run_once({'zcode_path': str(self.resources.parent)})
            self.assertEqual(build.call_count, 1)

    def test_restore_disables_timer_and_restores_exact_backup(self):
        backup = self.root / 'store/backups/base'
        backup.mkdir(parents=True)
        shutil.copy2(self.original, backup / 'app.asar')
        shutil.copytree(self.resources / 'app.asar.unpacked', backup / 'app.asar.unpacked')
        original_hash = auto.digest(self.original)
        fake_asar(self.original, True)
        current_hash = auto.digest(self.original)
        store = self.root / 'store'
        (store / 'active.json').write_text(json.dumps({
            'target': str(self.resources.parent), 'original_sha256': original_hash,
            'installed_sha256': current_hash, 'backup_dir': str(backup),
        }))
        with patch.object(auto, 'STATE_ROOT', store), patch.object(auto, 'require_root'), \
             patch.object(auto.os, 'chown'), patch.object(auto, 'execute') as execute, \
             patch.object(auto.subprocess, 'run') as status:
            status.return_value.returncode = 3
            auto.restore_active()
            self.assertEqual(auto.digest(self.original), original_hash)
            self.assertFalse((store / 'active.json').exists())
            self.assertEqual((self.resources / 'app.asar.unpacked/lib.node').read_text(), 'official')
            execute.assert_called_with(['systemctl', 'disable', '--now', auto.TIMER])

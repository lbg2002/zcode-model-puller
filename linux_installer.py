#!/usr/bin/env python3
"""Staged, reversible Linux installer for HHQ-666/zcode-model-puller.

This installer belongs next to inject_tool.py and zcode-model-puller.js.
Never executes the upstream injector with elevated privileges.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_ZCODE = Path(os.environ.get("ZCODE_PATH", "/opt/ZCode")).expanduser()
DATA_HOME = Path(os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local/share")))
CACHE_HOME = Path(os.environ.get("XDG_CACHE_HOME", str(Path.home() / ".cache")))
STORE = DATA_HOME / "zcode-model-puller-linux"
STATE = STORE / "state.json"
INJECTED_ENTRY = ("out", "renderer", "zcode-model-puller.js")


def log(message: str) -> None:
    print(message, flush=True)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for piece in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(piece)
    return digest.hexdigest()


def asar_header(path: Path) -> dict:
    """Use the format the upstream inject_tool.py expects; reject unreasonable headers."""
    with path.open("rb") as stream:
        header = stream.read(16)
        if len(header) != 16:
            raise ValueError("ASAR header is too short")
        length = int.from_bytes(header[8:12], "little")
        if not 0 < length < 64 * 1024 * 1024:
            raise ValueError(f"ASAR header length invalid: {length}")
        raw = stream.read(length)
        if len(raw) != length:
            raise ValueError("ASAR header is truncated")
    tree = json.JSONDecoder().raw_decode(raw.decode("utf-8"))[0]
    if not isinstance(tree, dict) or not isinstance(tree.get("files"), dict):
        raise ValueError("Invalid ASAR file index")
    return tree


def has_entry(asar: Path, parts: tuple[str, ...]) -> bool:
    node = asar_header(asar)
    try:
        for part in parts:
            node = node["files"][part]
        return True
    except (KeyError, TypeError):
        return False


def injected(asar: Path) -> bool:
    return has_entry(asar, INJECTED_ENTRY)


def ensure_expected_layout(asar: Path) -> None:
    required = [
        ("out", "main", "index.js"),
        ("out", "preload", "index.cjs"),
        ("out", "renderer", "index.html"),
    ]
    missing = ["/".join(parts) for parts in required if not has_entry(asar, parts)]
    if missing:
        raise ValueError("ZCode resources layout mismatch: " + ", ".join(missing))


def patch_injector(text: str) -> str:
    """Repoint a copy of the upstream injector, never modify the local source."""
    original = (
        'ZCODE_APP = Path("/Applications/ZCode.app")\n'
        'RESOURCES_DIR = ZCODE_APP / "Contents" / "Resources"'
    )
    replacement = (
        'ZCODE_APP = Path(os.environ["ZCODE_PATH"])\n'
        'RESOURCES_DIR = ZCODE_APP / "resources"'
    )
    if original in text:
        return text.replace(original, replacement, 1)
    # Also work if the user previously applied the Linux path patch manually.
    alternative = (
        'ZCODE_APP = Path(os.environ.get(\n'
        '    "ZCODE_PATH",\n'
        '    "/opt/ZCode" if sys.platform.startswith("linux")\n'
        '    else "/Applications/ZCode.app"\n'
        '))\n'
        'RESOURCES_DIR = (\n'
        '    ZCODE_APP / "resources"\n'
        '    if sys.platform.startswith("linux")\n'
        '    else ZCODE_APP / "Contents" / "Resources"\n'
        ')'
    )
    if alternative in text:
        return text.replace(alternative, replacement, 1)
    if replacement in text:
        return text
    raise ValueError("Unsupported inject_tool.py version. Cannot safely patch its ZCode paths")


def run(command: list[str], **kwargs) -> None:
    log("  $ " + " ".join(map(str, command)))
    subprocess.run(command, check=True, **kwargs)


def sudo(*args: str | Path) -> None:
    run(["sudo", "--", *map(str, args)])


def state_read() -> dict:
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
        return state if isinstance(state, dict) else {}
    except (OSError, ValueError):
        return {}


def state_write(value: dict) -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    tmp = STATE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, STATE)


def backup_source(source: Path, unpacked: Path) -> tuple[Path, str]:
    """Content-addressed original-backup; never overwrite a previous backup."""
    original_hash = sha256(source)
    backup_dir = STORE / "backups" / original_hash
    backup_asar = backup_dir / "app.asar"
    backup_unpacked = backup_dir / "app.asar.unpacked"
    if not backup_asar.exists():
        backup_dir.mkdir(parents=True, exist_ok=True)
        tmp = backup_dir / "app.asar.partial"
        shutil.copy2(source, tmp)
        if sha256(tmp) != original_hash:
            tmp.unlink(missing_ok=True)
            raise RuntimeError("Original backup hash mismatch")
        os.replace(tmp, backup_asar)
    elif sha256(backup_asar) != original_hash:
        raise RuntimeError("Backup hash mismatch; stopping instead of overwriting backup")
    if unpacked.is_dir() and not backup_unpacked.exists():
        partial_dir = backup_dir / "app.asar.unpacked.partial"
        if partial_dir.exists():
            shutil.rmtree(partial_dir)
        shutil.copytree(unpacked, partial_dir, symlinks=True)
        os.replace(partial_dir, backup_unpacked)
    log(f"✅ Official resources saved: {backup_dir}")
    return backup_dir, original_hash


def prepare_injection(source: Path, unpacked: Path, stage: Path) -> tuple[Path, Path]:
    staged_resources = stage / "ZCode" / "resources"
    staged_resources.mkdir(parents=True)
    shutil.copy2(source, staged_resources / "app.asar")
    if unpacked.is_dir():
        shutil.copytree(unpacked, staged_resources / "app.asar.unpacked", symlinks=True)

    tools_dir = stage / "tool"
    tools_dir.mkdir()
    script = HERE / "inject_tool.py"
    js_file = HERE / "zcode-model-puller.js"
    if not script.is_file() or not js_file.is_file():
        raise FileNotFoundError("Place install-linux.sh and linux_installer.py in the upstream repository root")
    patched = patch_injector(script.read_text(encoding="utf-8"))
    (tools_dir / "inject_tool.py").write_text(patched, encoding="utf-8")
    shutil.copy2(js_file, tools_dir / js_file.name)

    env = dict(os.environ)
    env["ZCODE_PATH"] = str(stage / "ZCode")
    log("🚀 Running the upstream injection and full ASAR verification in user-writable staging...")
    run([sys.executable, str(tools_dir / "inject_tool.py")], env=env)

    result = staged_resources / "app.asar"
    if not injected(result):
        raise RuntimeError("Staged app.asar has no injection marker")
    if sha256(result) == sha256(source):
        raise RuntimeError("ASAR did not change")
    result_unpacked = staged_resources / "app.asar.unpacked"
    if unpacked.is_dir() and not result_unpacked.is_dir():
        raise RuntimeError("Staged ASAR is missing unpacked native modules")
    return result, result_unpacked


def install_files(src_asar: Path, src_unpack: Path, res: Path) -> None:
    """Copy only verified artifacts with sudo; update the main ASAR last."""
    next_asar = res / "app.asar.puller-next"
    next_unpack = res / "app.asar.unpacked.puller-next"
    previous_unpack = res / "app.asar.unpacked.puller-previous"
    current_unpack = res / "app.asar.unpacked"
    for intermediate in (next_asar, next_unpack, previous_unpack):
        if intermediate.exists() or intermediate.is_symlink():
            raise RuntimeError(f"Stale intermediate {intermediate}; inspect it manually first")

    moved_old = False
    moved_new = False
    published = False
    try:
        sudo("install", "-o", "root", "-g", "root", "-m", "0644", src_asar, next_asar)
        if sha256(next_asar) != sha256(src_asar):
            raise RuntimeError("Copied ASAR hash mismatch")

        if src_unpack.is_dir():
            sudo("cp", "-a", src_unpack, next_unpack)
            sudo("chown", "-R", "root:root", next_unpack)
            if current_unpack.is_dir():
                sudo("mv", "-T", current_unpack, previous_unpack)
                moved_old = True
            sudo("mv", "-T", next_unpack, current_unpack)
            moved_new = True
        elif current_unpack.is_dir():
            raise RuntimeError("Original has native modules, but patched version has none")

        # With same-filesystem mv the primary ASAR switches atomically at the end.
        sudo("mv", "-T", next_asar, res / "app.asar")
        published = True
        log("✅ The validated ASAR has been installed")
    finally:
        if not published:
            # Original ASAR is still at its old location, so restore unpacked if needed.
            if moved_new:
                sudo("mv", "-T", current_unpack, next_unpack)
            if moved_old:
                sudo("mv", "-T", previous_unpack, current_unpack)
        else:
            # Nonessential cleanup failures must not roll back a successfully published ASAR.
            if moved_old:
                try:
                    sudo("rm", "-rf", previous_unpack)
                except subprocess.CalledProcessError:
                    log(f"⚠️ Cleanup required: {previous_unpack}")
        try:
            if next_asar.exists():
                sudo("rm", "-f", next_asar)
        except subprocess.CalledProcessError:
            pass
        if next_unpack.exists():
            log(f"ℹ️ Staged directory remains: {next_unpack}")


def restore_files(backup_dir: Path, res: Path) -> None:
    original = backup_dir / "app.asar"
    original_unpack = backup_dir / "app.asar.unpacked"
    if not original.is_file() or injected(original):
        raise RuntimeError("Backup missing or not a pristine ASAR")
    next_asar = res / "app.asar.puller-restore"
    next_unpack = res / "app.asar.unpacked.puller-restore"
    former_unpack = res / "app.asar.unpacked.puller-pre-restore"
    for intermediate in (next_asar, next_unpack, former_unpack):
        if intermediate.exists() or intermediate.is_symlink():
            raise RuntimeError(f"Stale intermediate {intermediate}; inspect first")
    moved_old = False
    moved_new = False
    published = False
    try:
        sudo("install", "-o", "root", "-g", "root", "-m", "0644", original, next_asar)
        if sha256(next_asar) != sha256(original):
            raise RuntimeError("Restore copy verification failed")
        if original_unpack.is_dir():
            sudo("cp", "-a", original_unpack, next_unpack)
            sudo("chown", "-R", "root:root", next_unpack)
        current_unpack = res / "app.asar.unpacked"
        if current_unpack.is_dir():
            sudo("mv", "-T", current_unpack, former_unpack)
            moved_old = True
        if original_unpack.is_dir():
            sudo("mv", "-T", next_unpack, current_unpack)
            moved_new = True
        sudo("mv", "-T", next_asar, res / "app.asar")
        published = True
    finally:
        if not published:
            current_unpack = res / "app.asar.unpacked"
            if moved_new:
                sudo("mv", "-T", current_unpack, next_unpack)
            if moved_old:
                sudo("mv", "-T", former_unpack, current_unpack)
        elif moved_old:
            try:
                sudo("rm", "-rf", former_unpack)
            except subprocess.CalledProcessError:
                log(f"⚠️ Cleanup required: {former_unpack}")
        if next_asar.exists():
            try:
                sudo("rm", "-f", next_asar)
            except subprocess.CalledProcessError:
                pass


def main() -> int:
    parser = argparse.ArgumentParser(description="ZCode Model Puller staged Ubuntu/Linux installer")
    parser.add_argument("command", nargs="?", choices=["install", "status", "restore"], default="install")
    parser.add_argument("--zcode-path", type=Path, default=DEFAULT_ZCODE,
                        help="ZCode install root (default: /opt/ZCode; also supports ZCODE_PATH)")
    args = parser.parse_args()

    if os.geteuid() == 0:
        parser.error("Run as a normal user, NOT with sudo. The installer uses sudo only for verified file copies.")
    if not sys.platform.startswith("linux"):
        parser.error("This installer targets Linux; use the original install.sh on macOS.")

    app = args.zcode_path.expanduser().resolve()
    resources = app / "resources"
    source = resources / "app.asar"
    unpacked = resources / "app.asar.unpacked"
    if not source.is_file():
        parser.error(f"ZCode ASAR not found: {source}")
    ensure_expected_layout(source)
    is_patched = injected(source)
    state = state_read()

    if args.command == "status":
        log(f"ZCode: {app}\nInjection: {'installed' if is_patched else 'not installed'}")
        if state.get("installed_sha256"):
            log(f"Recorded ASAR: {'match' if sha256(source) == state['installed_sha256'] else 'changed'}")
        return 0

    if args.command == "restore":
        if not is_patched:
            log("ℹ️ Already unmodified; no restore needed")
            return 0
        if state.get("target") != str(app) or state.get("installed_sha256") != sha256(source):
            raise RuntimeError("No matching Linux-installer state for this ASAR; refusing to restore the wrong version")
        backup = Path(state["backup_dir"])
        if sha256(backup / "app.asar") != state["original_sha256"]:
            raise RuntimeError("Backup SHA-256 mismatch")
        log("⚠️ Close ZCode completely before restoring. Restoring from original backup...")
        restore_files(backup, resources)
        if injected(source):
            raise RuntimeError("Post-restore validation failed")
        state_write({**state, "restored_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                     "installed_sha256": None})
        log("✅ Original ZCode restored; your user configuration is untouched")
        return 0

    if is_patched:
        log("✅ ZCode is already injected; nothing to do. After an apt upgrade, run this same command again.")
        log("ℹ️ This does not update an existing injection's plugin JS. See LINUX.md for upgrade notes.")
        return 0

    for executable in ("python3", "node", "npx", "sudo"):
        if not shutil.which(executable):
            raise RuntimeError(f"Required executable missing: {executable}")

    # Backup is performed before any build or privileged write.
    backup_dir, original_hash = backup_source(source, unpacked)
    CACHE_HOME.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="zcode-puller-stage-", dir=CACHE_HOME) as folder:
        stage = Path(folder)
        result_asar, result_unpack = prepare_injection(source, unpacked, stage)
        injected_hash = sha256(result_asar)
        log("⚠️ Close ZCode completely now; replacing its resources requires sudo.")
        install_files(result_asar, result_unpack, resources)

    if not injected(source) or sha256(source) != injected_hash:
        raise RuntimeError("Post-installation validation failed! See backup and restore instructions in LINUX.md")
    state_write({
        "target": str(app),
        "backup_dir": str(backup_dir),
        "original_sha256": original_hash,
        "installed_sha256": injected_hash,
        "installed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    })
    log("🎉 Installed successfully. Restart ZCode, then check Settings > Models > Custom provider.")
    log("🔁 After upgrading ZCode with apt, just run: ./install-linux.sh")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, RuntimeError, OSError, subprocess.CalledProcessError) as exc:
        log(f"❌ {exc}")
        sys.exit(1)
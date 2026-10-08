import importlib.util
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "linux_installer.py"
spec = importlib.util.spec_from_file_location("linux_installer", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def fake_asar(path, injected=False, omit=None, themed=False):
    tree = {"files": {"out": {"files": {
        "main": {"files": {"index.js": {"size": 10}}},
        "preload": {"files": {"index.cjs": {"size": 10}}},
        "renderer": {"files": {"index.html": {"size": 10}}},
    }}}}
    if injected:
        tree["files"]["out"]["files"]["renderer"]["files"]["zcode-model-puller.js"] = {"size": 10}
    if themed:
        tree["files"]["out"]["files"]["renderer"]["files"]["zcode-theme-manager.js"] = {"size": 10}
    if omit:
        tree["files"]["out"]["files"][omit[0]]["files"].pop(omit[1])
    raw = json.dumps(tree).encode("utf-8")
    path.write_bytes(b"\0" * 8 + len(raw).to_bytes(4, "little") + b"\0" * 4 + raw + b"P" * 12)


def fake_sudo(*args):
    argv = list(map(str, args))
    cmd, rest = argv[0], argv[1:]
    if cmd == "install":
        shutil.copy2(rest[-2], rest[-1]); return
    if cmd == "cp":
        shutil.copytree(rest[-2], rest[-1], symlinks=True); return
    if cmd == "chown":
        return
    if cmd == "mv":
        src, dst = map(Path, rest[-2:])
        os.replace(src, dst); return
    if cmd == "rm":
        p = Path(rest[-1])
        shutil.rmtree(p) if p.is_dir() else p.unlink(missing_ok=True)
        return
    raise AssertionError(f"Unexpected sudo: {args}")


class LinuxInstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_archive_and_marker(self):
        p = self.root / "app.asar"
        fake_asar(p)
        self.assertFalse(mod.injected(p))
        mod.ensure_expected_layout(p)
        fake_asar(p, injected=True)
        self.assertTrue(mod.injected(p))
        self.assertFalse(mod.theme_installed(p))
        fake_asar(p, injected=True, themed=True)
        self.assertTrue(mod.theme_installed(p))

    def test_archived_theme_fingerprint_detects_code_changes(self):
        expected = self.root / "theme.js"
        expected.write_text("console.log('theme v1');", encoding='utf-8')
        packed = self.root / 'real-style.asar'
        contents = expected.read_bytes()
        tree = {"files": {"out": {"files": {"renderer": {"files": {
            "zcode-theme-manager.js": {"size": len(contents), "offset": "0"}
        }}}}}}
        payload = json.dumps(tree).encode('utf-8')
        # Real ASAR archives start with a size Pickle (8 bytes) followed by
        # a header Pickle. Header metadata includes two 4-byte lengths.
        padding = (4 - len(payload) % 4) % 4
        header_body = len(payload).to_bytes(4, 'little') + payload + b'\0' * padding
        header_pickle = len(header_body).to_bytes(4, 'little') + header_body
        size_pickle = (4).to_bytes(4, 'little') + len(header_pickle).to_bytes(4, 'little')
        packed.write_bytes(size_pickle + header_pickle + contents)
        self.assertTrue(mod.theme_up_to_date(packed, expected))
        expected.write_text("console.log('theme v2');", encoding='utf-8')
        self.assertFalse(mod.theme_up_to_date(packed, expected))

    def test_reject_wrong_archive_shape(self):
        p = self.root / "app.asar"
        p.write_bytes(b"x" * 10)
        with self.assertRaises(ValueError):
            mod.asar_header(p)
        fake_asar(p, omit=("preload", "index.cjs"))
        with self.assertRaisesRegex(ValueError, "out/preload/index.cjs"):
            mod.ensure_expected_layout(p)

    def test_node18_and_modern_node_pick_compatible_asar(self):
        self.assertEqual(mod.asar_package_for_node('v18.19.1'), '@electron/asar@3.4.1')
        self.assertEqual(mod.asar_package_for_node('v20.19.0'), '@electron/asar@3.4.1')
        self.assertEqual(mod.asar_package_for_node('v22.11.0'), '@electron/asar@3.4.1')
        self.assertEqual(mod.asar_package_for_node('v22.12.0'), '@electron/asar@4.3.1')
        self.assertEqual(mod.asar_package_for_node('v24.15.0'), '@electron/asar@4.3.1')
        with self.assertRaisesRegex(RuntimeError, '>=18'):
            mod.asar_package_for_node('v16.20.0')
        with self.assertRaisesRegex(ValueError, 'Cannot parse'):
            mod.asar_package_for_node('unknown')

    def test_node_probe_uses_actual_runtime(self):
        from types import SimpleNamespace
        with patch.object(mod.subprocess, 'run', return_value=SimpleNamespace(stdout='v18.19.1\n')) as run:
            self.assertEqual(mod.active_asar_package({'PATH':'/usr/bin:/bin'}), ('@electron/asar@3.4.1', 'v18.19.1'))
            self.assertEqual(run.call_args.args[0], ['node', '--version'])
            self.assertEqual(run.call_args.kwargs['env']['PATH'], '/usr/bin:/bin')

    def test_staged_injector_uses_pinned_asar_package(self):
        sample = ( 'import os\n'
                   'ZCODE_APP = Path("/Applications/ZCode.app")\n'
                   'RESOURCES_DIR = ZCODE_APP / "Contents" / "Resources"\n'
                   'run(["npx", "--yes", "@electron/asar", "extract", archive, directory])\n'
                   'run(["npx", "--yes", "@electron/asar", "pack", directory, archive])\n')
        patched = mod.patch_injector(sample)
        self.assertIn('ZCODE_PULLER_ASAR_PACKAGE', patched)
        self.assertEqual(patched.count('os.environ.get("ZCODE_PULLER_ASAR_PACKAGE", "@electron/asar")'), 2)
        self.assertEqual(mod.patch_injector(patched), patched)

    def test_patch_injector_original(self):
        sample = 'import os\nZCODE_APP = Path("/Applications/ZCode.app")\nRESOURCES_DIR = ZCODE_APP / "Contents" / "Resources"\n'
        patched = mod.patch_injector(sample)
        self.assertIn('Path(os.environ["ZCODE_PATH"])', patched)
        self.assertIn('RESOURCES_DIR = ZCODE_APP / "resources"', patched)
        self.assertEqual(mod.patch_injector(patched), patched)

    def test_patch_injector_previous_linux_patch(self):
        sample = '''ZCODE_APP = Path(os.environ.get(
    "ZCODE_PATH",
    "/opt/ZCode" if sys.platform.startswith("linux")
    else "/Applications/ZCode.app"
))
RESOURCES_DIR = (
    ZCODE_APP / "resources"
    if sys.platform.startswith("linux")
    else ZCODE_APP / "Contents" / "Resources"
)'''
        self.assertIn('Path(os.environ["ZCODE_PATH"])', mod.patch_injector(sample))

    def test_patch_injector_must_match(self):
        with self.assertRaisesRegex(ValueError, "Unsupported"):
            mod.patch_injector('ZCODE_APP = Path("/unknown/app")')

    def test_backup_idempotent_and_verified(self):
        source = self.root / "app.asar"
        fake_asar(source)
        unpacked = self.root / "app.asar.unpacked"
        unpacked.mkdir()
        (unpacked / "native.node").write_text("original")
        with patch.object(mod, "STORE", self.root / "state"):
            d, h = mod.backup_source(source, unpacked)
            self.assertEqual(mod.sha256(d / "app.asar"), h)
            self.assertEqual((d / "app.asar.unpacked/native.node").read_text(), "original")
            self.assertEqual(mod.backup_source(source, unpacked)[0], d)
            (d / "app.asar").write_text("corrupted")
            with self.assertRaisesRegex(RuntimeError, "Backup hash mismatch"):
                mod.backup_source(source, unpacked)

    def test_install_then_restore_files(self):
        res = self.root / "resources"; res.mkdir()
        official = res / "app.asar"; fake_asar(official)
        backup = self.root / "backup"; backup.mkdir()
        shutil.copy2(official, backup / "app.asar")
        old_unpack = res / "app.asar.unpacked"; old_unpack.mkdir()
        (old_unpack / "native.node").write_text("old")
        shutil.copytree(old_unpack, backup / "app.asar.unpacked")

        stage = self.root / "stage"; stage.mkdir()
        patched = stage / "app.asar"; fake_asar(patched, injected=True)
        new_unpack = stage / "app.asar.unpacked"; new_unpack.mkdir()
        (new_unpack / "native.node").write_text("new")
        with patch.object(mod, "sudo", side_effect=fake_sudo):
            mod.install_files(patched, new_unpack, res)
            self.assertTrue(mod.injected(official))
            self.assertEqual((old_unpack / "native.node").read_text(), "new")
            mod.restore_files(backup, res)
        self.assertFalse(mod.injected(official))
        self.assertEqual((old_unpack / "native.node").read_text(), "old")

    def test_restore_to_earlier_model_puller_injection(self):
        res = self.root / "resources"; res.mkdir()
        current = res / "app.asar"; fake_asar(current, injected=True, themed=True)
        backup = self.root / "backup"; backup.mkdir()
        fake_asar(backup / "app.asar", injected=True)
        with patch.object(mod, "sudo", side_effect=fake_sudo):
            mod.restore_files(backup, res, allow_injected=True)
        self.assertTrue(mod.injected(current))
        self.assertFalse(mod.theme_installed(current))

    def test_restore_can_roll_back_previous_theme_revision(self):
        res = self.root / "resources"; res.mkdir()
        backup = self.root / "backup"; backup.mkdir()
        fake_asar(backup / "app.asar", injected=True, themed=True)
        current = res / "app.asar"; fake_asar(current, injected=True, themed=True)
        with patch.object(mod, "sudo", side_effect=fake_sudo):
            mod.restore_files(backup, res, allow_injected=True)
        self.assertTrue(mod.theme_installed(current))

    def test_rollback_on_failed_primary_asar_move(self):
        res = self.root / "resources"; res.mkdir()
        official = res / "app.asar"; fake_asar(official)
        orig_sha = mod.sha256(official)
        old_unpack = res / "app.asar.unpacked"; old_unpack.mkdir()
        (old_unpack / "native.node").write_text("old")
        stage = self.root / "stage"; stage.mkdir()
        patched = stage / "app.asar"; fake_asar(patched, injected=True)
        new_unpack = stage / "app.asar.unpacked"; new_unpack.mkdir()
        (new_unpack / "native.node").write_text("new")

        def failed_sudo(*args):
            if args[0] == "mv" and str(args[-1]) == str(res / "app.asar"):
                raise OSError("simulated failure")
            return fake_sudo(*args)

        with patch.object(mod, "sudo", side_effect=failed_sudo):
            with self.assertRaisesRegex(OSError, "simulated failure"):
                mod.install_files(patched, new_unpack, res)
        self.assertEqual(mod.sha256(official), orig_sha)
        self.assertEqual((old_unpack / "native.node").read_text(), "old")


if __name__ == "__main__":
    unittest.main()

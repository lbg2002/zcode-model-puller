# Linux / Ubuntu (.deb) support for ZCode Model Puller

This is a Linux add-on for the upstream repository <https://github.com/HHQ-666/zcode-model-puller> (MIT licensed). It keeps upstream's injection/ASAR verification algorithm intact, but runs it against an unprivileged staging copy instead of the installed ZCode application.

## Install / reinstall after ZCode updates

Put `install-linux.sh` and `linux_installer.py` **at the root of the upstream repository** (beside `inject_tool.py` and `zcode-model-puller.js`). On Ubuntu with ZCode installed at `/opt/ZCode`:

```bash
cd ~/git_soft/zcode-model-puller
./install-linux.sh
```

Do **not** run the command with `sudo`. The script requests sudo only for the final verified ASAR/module copy into `/opt/ZCode/resources/`.

If ZCode is installed somewhere else:

```bash
./install-linux.sh --zcode-path /path/to/ZCode
# or
ZCODE_PATH=/path/to/ZCode ./install-linux.sh
```

On each ZCode `.deb`/`apt` update, run **the same command**. The script recognizes a currently injected ASAR and leaves it untouched; after an `apt` update replaces ASAR, it automatically processes the new original version. It does **not** run any resident watch/daemon and does **not** automatically reinstall after an update; invoke it yourself.

## How it works

1. Validates that the app has `out/main/index.js`, `out/preload/index.cjs`, and `out/renderer/index.html` in its ASAR.
2. Refuses to overwrite a current injected installation (idempotent).
3. Saves a **SHA-256 checked** pristine ASAR backup, and `app.asar.unpacked` if present, at `~/.local/share/zcode-model-puller-linux/backups/<sha256>/`.
4. Creates a temporary working copy under `~/.cache/`.
5. Adjusts a **temporary copy** of upstream `inject_tool.py` to point to the staged Linux `/resources` directory (the original source remains unchanged).
6. Runs upstream injection + syntax checks + verification as an ordinary user.
7. Copies verified assets via a restricted set of `sudo install`, `sudo cp`, `sudo chown`, `sudo mv` and cleanup commands. The main ASAR is replaced last.
8. Writes installer state (`~/.local/share/zcode-model-puller-linux/state.json`) for version-specific rollback.

This intentionally uses upstream's `npx --yes @electron/asar` and so may need npm network access the first time. Review the upstream code before running it.

## Status / rollback

```bash
./install-linux.sh status
# completely exit ZCode first
./install-linux.sh restore
```

Restoration is available only for ASARs installed using this script, with an exact current-ASAR SHA match. This prevents a backup of an older release from being blindly copied over a newer application after an apt update. Restoring leaves user settings in `~/.zcode/` intact.

## If you already manually injected the existing release

`./install-linux.sh` reports *already injected*, and intentionally **does not re-inject or overwrite the manually injected ASAR**. This is expected and safe. The next time apt updates ZCode, the command will work on its newly installed official ASAR and record state for future rollback.

To restore your **pre-existing manual** injection right now, use the manual backups you already created in `/opt/ZCode/resources/` (e.g., `app.asar.before-puller` and `app.asar.unpacked.before-puller`) after closing ZCode. Do **not** run this add-on's `restore` for a manual injection; it will refuse because it did not record the corresponding state.

## Known limitations

- This script supports the standard Linux Electron layout `<ZCODE_PATH>/resources/app.asar`; it does not target AppImage, Flatpak or Snap automatically.
- The upstream injector currently depends on dynamic anchors specific to ZCode 3.12+; an incompatible future ZCode update may fail during staging. The official installation is left intact if injection/validation fails.
- This is **manual**, one-command reinjection after updates, not a background service.
- Installing a new version of the *plugin itself* without a ZCode update is not implemented while the client is already injected. Avoid stacking repeated modifications on a patched ASAR.
- Closing ZCode before asset replacement is essential, as the running Electron process may still depend on open native modules. Best practice: exit ZCode before invoking the installer.
- This Linux add-on has unit tests for path patching, ASAR format, backup, install/restore, and rollback. Tests cannot substitute for an end-to-end test on your exact ZCode release.

## Testing

```bash
python3 -m unittest discover -s tests -p 'test_linux_installer.py' -v
```

## Upstream preservation

The existing macOS `install.sh`, `uninstall.sh` and launchd watcher stay unchanged. Linux users run `./install-linux.sh` instead. If you fork the upstream repository, copy these two scripts, this documentation and the `tests/` folder into the fork, then commit/push. Keep the original MIT copyright/license.
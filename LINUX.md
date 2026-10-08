# Linux / Ubuntu (.deb) support for ZCode Model Puller

This is a Linux add-on for the upstream repository <https://github.com/HHQ-666/zcode-model-puller> (MIT licensed). It keeps upstream's injection/ASAR verification algorithm intact, but runs it against an unprivileged staging copy instead of the installed ZCode application.

## Optional Linux theme manager / 自定义主题

此 Fork 新增 **[THEME.md](THEME.md)**：六套预设、自定义 HEX 配色、实时预览、确认保存、取消回退和恢复官方主题，入口位于 ZCode 右下角。保留原有自动拉取模型能力。

**已有模型拉取按钮并启用 systemd 守护时的升级方式：**

```bash
cd ~/git_soft/zcode-model-puller
git pull --ff-only origin main
# 先完全退出 ZCode
bash install-auto-linux.sh install
sudo systemctl start zcode-model-puller-auto.service
bash install-auto-linux.sh logs
bash install-linux.sh status
```

Linux 版同时支持已注入旧版的**安全升级**：读取 ASAR 内当前主题 JS 内容，与本 Fork 的已安装源文件进行 SHA-256 比较；若内容不同，则保存升级前快照、在低权限临时目录重新打包并验证，最终才替换资源。systemd 检测到 ZCode 正在运行会推迟自动替换，待应用退出后再处理。

**回滚语义**：`restore` 会恢复至**本安装器记录的升级前资源**。如果升级前已经注入模型拉取插件，回滚后模型拉取仍可存在，不意味着彻底恢复官方原版。需要去除主题颜色时，优先使用主题管理器内的「恢复官方默认」，不必回滚 ASAR。

自动维护不会 `git pull` 或更新仓库里的插件源码，修改代码后必须重新执行一次 `bash install-auto-linux.sh install` 更新 root-owned 快照。

---

## Full lifecycle: automatic maintenance with systemd (opt-in)

Install the **system service and timer once** (normal manual one-shot installation above also remains available):

```bash
cd ~/git_soft/zcode-model-puller
bash install-auto-linux.sh install
bash install-auto-linux.sh status
```

The setup asks for your administrator password **once**. Every subsequent timer-based reinstall is unattended; no scheduled or background sudo password prompt is needed. A root-owned copy of the maintenance code is installed in `/usr/local/lib/zcode-model-puller-auto/`; the timer (`zcode-model-puller-auto.timer`) starts automatically at boot and checks approximately **every five minutes**. It detects an ASAR that was replaced by an apt/deb update **or another updater**, and invokes the original injection logic **as a dedicated unprivileged `zcode-puller` system user**. Only after the original ASAR has been backed up, the staged injection verified, and the original release rechecked for changes does the root service publish the validated new resources. It skips a model-puller ASAR only when its archived theme-manager script matches the installed local version; missing or changed theme scripts trigger a safe staged upgrade. A running ZCode process defers auto replacement until exit. No sudo prompts occur on subsequent timer runs.

When ZCode is updated, **restart the app after the watcher repairs its ASAR** to load the button. The watcher does not kill or restart ZCode or change your custom provider configuration. It also does not automatically update this plugin's GitHub code; the system service executes a snapshot of the code you reviewed at setup time.

```bash
# Trigger a check immediately (useful after ZCode updates)
sudo systemctl start zcode-model-puller-auto.service
# Check the timer
systemctl list-timers --all zcode-model-puller-auto.timer
# Read injection failures or successes
journalctl -u zcode-model-puller-auto.service -n 100 --no-pager
# Stop the watcher but keep the current injected client and backups
bash install-auto-linux.sh remove
# Restore the exact last official version, if *this system service* injected it;
# also disables the automatic timer to prevent immediate re-injection.
# Fully quit ZCode before running this command.
bash install-auto-linux.sh restore
```

For a different install root under `/opt`: `bash install-auto-linux.sh install --zcode-path /opt/AnotherZCode`. For other paths, use the manual installer instead. If you change the plugin's own source, re-run `bash install-auto-linux.sh install` to update the root-owned service snapshot. The timer never blindly git-pulls arbitrary code with administrator privileges.

**Node.js environment:** the setup records the currently resolved `npx` binary directory and makes it available to the unprivileged builder. Node and npx must both be reachable/readable to the dedicated system user; if you installed Node via conda or nvm in a private home directory, systemd's unprivileged builder may not access it. A system-wide Node.js installation is most reliable. Inspect the journal if `npx` cannot run. The first build can require access to npm to install `@electron/asar` into its separate worker cache.

**Scope and safeguards:** use only on a machine you administer and only after reviewing the MIT-licensed upstream injector. The system timer does NOT repair an incompatible major ZCode update by bypassing safety checks: failures are logged and retried on future runs, leaving the official installation unmodified until validation succeeds. systemd status may show a failed run, but the timer remains enabled. Automatic writing of ZCode program resources requires root authority, so enabling the service is a considered security decision. The installer never runs the untrusted `npx` or upstream injection script as root.

---

## Install / reinstall after ZCode updates

Clone **this fork**, which already contains `install-linux.sh`, `linux_installer.py`, `inject_tool.py`, and `zcode-model-puller.js`. On Ubuntu with ZCode installed at `/opt/ZCode`:

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

On each ZCode `.deb`/`apt` update, run **the same command**. The script recognizes a currently injected ASAR and leaves it untouched; after an `apt` update replaces ASAR, it automatically processes the new original version. It does **not** automatically reinstall unless you opt in to the systemd timer above.

## How it works

1. Validates that the app has `out/main/index.js`, `out/preload/index.cjs`, and `out/renderer/index.html` in its ASAR.
2. Skips an already current theme-enabled installation; safely upgrades older injections only after staging, backup and validation.
3. Saves a **SHA-256 checked** exact pre-installation ASAR snapshot (which may itself include an older Model Puller), and `app.asar.unpacked` if present, at `~/.local/share/zcode-model-puller-linux/backups/<sha256>/`.
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

Restoration is available only for ASARs installed using this script, with an exact current-ASAR SHA match. If an existing injected Model Puller was upgraded, restore returns to that pre-theme snapshot rather than removing Model Puller completely. This prevents a backup of an older release from being blindly copied over a newer application after an apt update. Restoring leaves user settings in `~/.zcode/` intact.

## If you already manually injected the existing release

`./install-linux.sh` now **upgrades** an existing model-only injected ASAR when its theme script is missing or stale. It saves the current ASAR and unpacked modules first, then rebuilds and validates in an ordinary-user staging directory; it never appends duplicate IPC handlers. If the theme script is already current, it skips unnecessary repacking.

To restore your **pre-existing manual** injection right now, use the manual backups you already created in `/opt/ZCode/resources/` (e.g., `app.asar.before-puller` and `app.asar.unpacked.before-puller`) after closing ZCode. Do **not** run this add-on's `restore` for a manual injection; it will refuse because it did not record the corresponding state.

## Known limitations

- This script supports the standard Linux Electron layout `<ZCODE_PATH>/resources/app.asar`; it does not target AppImage, Flatpak or Snap automatically.
- The upstream injector currently depends on dynamic anchors specific to ZCode 3.12+; an incompatible future ZCode update may fail during staging. The official installation is left intact if injection/validation fails.
- Manual one-command reinstalls and opt-in automatic systemd maintenance are both supported.
- Updating the theme-manager script without a ZCode update is supported by exact source-file fingerprinting. Unrelated changes to the model-puller JS alone do not force a repackage.
- Closing ZCode before asset replacement is essential, as the running Electron process may still depend on open native modules. Best practice: exit ZCode before invoking the installer.
- This Linux add-on has unit tests for path patching, ASAR format, backup, install/restore, and rollback. Tests cannot substitute for an end-to-end test on your exact ZCode release.

## Testing

```bash
python3 -m unittest discover -s tests -v
```

## Upstream preservation

This repository is a downstream MIT-licensed fork of [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller). The original macOS `install.sh`, `uninstall.sh` and launchd watcher remain in the tree. Linux users should use `bash install-linux.sh` or opt in to `bash install-auto-linux.sh install`. Never run the macOS `./install.sh` on Ubuntu; it tries to install a launchd watcher. See [README.md](README.md), [CHANGELOG.md](CHANGELOG.md), and [SECURITY.md](SECURITY.md) for verified features and publication caveats.
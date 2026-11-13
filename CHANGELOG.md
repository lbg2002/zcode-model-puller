# Changelog

All notable changes for this downstream fork are documented here. The fork preserves the upstream MIT license and credits its author.

## 2026-11-13 — ZCode Enhancer v2.0.0 (Classical Chinese Theme Studio, Line-Art Ornaments & Model Puller v2.0)
- **All-Chinese Classical Theme System (10 Presets)**: Replaced all Western presets with 10 curated Chinese aesthetic themes — 6 dark (`墨韵寒香`, `千里江山`, `紫禁朱墙`, `敦煌飞天`, `江南烟雨`, `松烟沉香`) and 4 light (`青花瓷影`, `宣纸书卷`, `汝窑天青`, `玉露茗茶`) — with automatic, non-destructive migration for previously saved legacy preset IDs.
- **Chinese Line-Art Illustrations & Ornaments**: Added 6 dynamic SVG white-line (白描) illustrations (`远山云水`, `寒梅修竹`, `祥云瑞鹤`, `轩窗回纹`, `曲水荷风`, `松风琴韵` + `素面无纹`), 3 ink density levels (`淡墨轻岚`, `适中意境`, `浓墨重彩`), 3 classical frame ornaments (`回纹博古角花`, `宋式双阑框线`, `无框素边`), and 4 local font styles (`清雅黑体`, `书卷宋刻`, `翰墨楷书`, `系统原生`).
- **Fixed Left Sidebar & System Theme Conflict**: Overrode `--color-background-win-alt`, `--color-remote-foreground-muted`, `--color-primary`, `--color-primary-foreground`, `--color-input`, and `--color-input-border` on `:root`, `html.dark`, and `[data-desktop-window-frame="true"]`; synchronized root `dark` / `theme-zai-dark` / `theme-zai-light` classes with the active custom theme; and lowered sidebar width threshold to support scaled viewports. Resolves dark sidebar backgrounds clashing with light custom themes and fixes invisible switch tracks.
- **Publish-Ready Sharing & Slots**: Added up to 6 custom saved theme slots (`zcode-puller-theme-slots-v1`), clipboard/prompt JSON theme export and import, and global shortcut `Alt+Shift+T`.
- **Model Puller v2.0 Enhancements**: Styled the puller button, modal, badges, and toast to follow the active Chinese theme; added model family filter chips (`GLM / 智谱`, `DeepSeek`, `Qwen / 通义`, `Claude`, `GPT / o1 / o3`, `Gemini`, `新模型`, `已添加`), `反选`, `选当前筛选`, `复制ID`, and optional sync pruning (`同步清理：将未勾选的「已添加」模型从当前供应商列表中移除`).
- **Enabled Theme Manager by Default**: `inject_tool.py` now enables the theme manager by default unless `ZCODE_PULLER_ENABLE_THEME=0` is set.

## 2026-11-04 — Theme Manager v1.2.0 (nine palettes and full-shell sidebar)
- Added three Chinese-inspired palettes: 墨韵寒香, 青花瓷影, 千里江山, with exact requested syntax, selection and cursor colors.
- Completed syntax / selection / cursor tokens for all six existing themes; the editor now exposes thirteen adjustable colors.
- Improved sidebar theming with scoped semantic aliases and geometry-bounded left-shell styling, including list hover and selected states.
- Made the theme dialog follow its active dark/light palette and added a syntax preview.
- Kept existing v1 seven-color custom presets compatible and reversible; added tests for palettes, migration, security, full-shell selection, and CSS scope.

## Unreleased — ZCode Enhancer branding and settings integration
- Renamed the public-facing project title to **ZCode Enhancer** (repository slug, existing install directories and systemd unit names unchanged for compatibility).
- Moved the theme manager entry from a permanently visible bottom-right floating launcher into **Settings > Appearance > Custom theme**.
- Added dynamic reattachment when React recreates the Appearance settings panel; preserves existing theme preferences and Model Puller.

## Unreleased — theme manager for Linux
- Added renderer-only `zcode-theme-manager.js` with 6 palettes, seven color controls, live preview, apply/cancel, and restore-official actions.
- Integrated the theme asset into the verified ASAR injection path without changing the original macOS default installation.
- Added exact archived theme-script fingerprint detection so existing model-only injections and updated theme code can be staged and upgraded safely.
- Extended the systemd snapshot to include theme asset, defer resource replacement while ZCode is running, and retain precise pre-upgrade backups.
- Added `THEME.md` plus JavaScript behavior tests and Python version/upgrade/rollback tests.

## 2026-10-08 — Linux preview
- Added `install-linux.sh` / `linux_installer.py` for staged Linux `.deb` installation at `/opt/ZCode`.
- Added SHA-256 checked backups, bounded restore by exact installed version, and validation before replacing the installed ASAR.
- Added optional `install-auto-linux.sh` and `auto_maintain.py` systemd timer for periodic checks, backed by unprivileged `zcode-puller` ASAR builds.
- Added safe skip on already-injected ASAR, failure throttling, and logs via journalctl.
- Fixed Linux status operation so `systemctl list-timers` does not start an interactive pager.
- Added unit tests for Linux install / watcher behavior.

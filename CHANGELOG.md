# Changelog

All notable changes for this downstream fork are documented here. The fork preserves the upstream MIT license and credits its author.

## Unreleased — ZCode Enhancer branding and settings integration
- Renamed the public-facing project title to **ZCode Enhancer** (repository slug, existing install directories and systemd unit names unchanged for compatibility).
- Moved the theme manager entry from a permanently visible bottom-right floating launcher into **Settings > Appearance > Custom theme**.
- Added dynamic reattachment when React recreates the Appearance settings panel; preserves existing theme preferences and Model Puller.

## Unreleased — theme manager for Linux
- Added renderer-only `zcode-theme-manager.js` with 6 palettes, seven color controls, live preview, apply/cancel, and restore-official actions.
- Integrated the theme asset into the verified ASAR injection path without changing the original macOS default installation.
- Added exact archived theme-script fingerprint detection so existing model-only injections and updated theme code can be staged and upgraded safely.
- Extended the systemd snapshot to include theme asset, defer resource replacement while ZCode is running, and retain precise pre-upgrade backups.
- Added `THEME.md` plus 7 JavaScript behavior tests and new Python version/upgrade/rollback tests.
- Theme manager installation and GUI display were confirmed by one Ubuntu user. The new Settings entry itself still requires in-app verification; an actual post-update re-injection remains unverified.

## Unreleased — public documentation and CI
- Reorganized README for Ubuntu/Linux and macOS, with clear platform limitations.
- Added security, contribution, issue-reporting, and automated-test guidance.
- Clarified that real post-upgrade unattended reinjection still needs end-to-end field verification.

## 2026-10-08 — Linux preview
- Added `install-linux.sh` / `linux_installer.py` for staged Linux `.deb` installation at `/opt/ZCode`.
- Added SHA-256 checked backups, bounded restore by exact installed version, and validation before replacing the installed ASAR.
- Added optional `install-auto-linux.sh` and `auto_maintain.py` systemd timer for periodic checks, backed by unprivileged `zcode-puller` ASAR builds.
- Added safe skip on already-injected ASAR, failure throttling, and logs via journalctl.
- Fixed Linux status operation so `systemctl list-timers` does not start an interactive pager.
- Added unit tests for Linux install / watcher behavior.

### Verification and known limitations
- Verified on one Ubuntu `.deb` installation that the injected UI button appears and retrieves models.
- Verified the systemd timer is enabled/active and completed two no-op checks on an already-injected installation.
- **Not yet verified:** an actual ZCode upgrade followed by unattended rebuild, deployment, and restart.
- Not tested for Windows, Flatpak, Snap, or AppImage; new ZCode versions may break injection anchors.
- No GitHub Release or version tag is implied by this changelog entry.

# Security policy / 安全说明

This is an **unofficial third-party modification** of ZCode's Electron application resources. Use only on machines and ZCode installations you administer. A successful test suite cannot guarantee compatibility with future versions.

## Before installing

- Review the code, especially `inject_tool.py`, `zcode-model-puller.js`, `linux_installer.py`, and `auto_maintain.py`.
- Back up your application resources and user configuration. Never share `~/.zcode/v2/provider_config.json` publicly: it may contain API keys or personal endpoints.
- `npx --yes @electron/asar` may fetch executable npm code from the network. Consider verifying or pinning your npm dependencies in a controlled environment.
- Third-party providers may log `/models` requests and use your provided credentials. Only configure trusted endpoints.

## Manual installation

`bash install-linux.sh` stages and checks the ASAR as the normal user, then uses sudo only to publish validated files under the installation directory. It is not guaranteed to be interruption-proof; consult `LINUX.md` for backups and exact-version restore.

## Persistent systemd maintenance

`bash install-auto-linux.sh install` creates a **root-owned system service and timer**. It can write program resources without prompting each time. The ASAR build and `npx` invocation run under a dedicated unprivileged `zcode-puller` service account, but this does **not** remove all risks of a privileged auto-repair service.

- The timer inspects ZCode's ASAR about every five minutes and attempts recovery only when the marker is absent.
- Only the reviewed source snapshot copied at installation is executed; it does **not** download new project commits or silently upgrade the plugin itself.
- Incompatible ZCode updates can fail. The service logs the failure and throttles repeated rebuilds; do not disable validation to force an injection.
- ZCode should be restarted after successful reinjection. Prefer not to replace application resources while it is actively running.
- A private nvm/Conda Node.js binary may not be readable by the service user; prefer a system-wide executable.
- To stop the privileged timer without removing the current injection: `bash install-auto-linux.sh remove`.

## Reporting security issues

Do **not** post API keys, provider configuration, full home paths, or private URLs in public GitHub issues. For a suspected vulnerability, use GitHub private vulnerability reporting if enabled on this repository; otherwise contact the maintainer privately before posting a public proof of concept. Ordinary non-sensitive bugs can use the issue template.

## Support status

Linux automated tests exist, and one Ubuntu system has confirmed successful no-op timer checks. A full unattended restore after a real ZCode upgrade has **not** been validated yet. These tools are supplied under the [MIT license](LICENSE), without warranty.

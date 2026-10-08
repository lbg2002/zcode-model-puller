# Contributing / 贡献指南

Thanks for helping improve this **unofficial Linux fork** of [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller). Suggestions, issue reports and pull requests in Chinese or English are welcome.

## Filing a reproducible issue

Please include: OS and version, install method (`.deb`/other), ZCode version, Python/Node/npx versions, relevant `systemctl` or `journalctl` output, whether the client was closed during installation, and exact reproduction steps.

**Remove all API keys, tokens, provider URLs containing secrets, and private data** before posting anything publicly. Do not upload a raw provider configuration file.

## Development workflow

1. Create a fork/branch and keep the original MIT license and upstream attribution.
2. Change the smallest practical area; Linux-specific behavior should not silently change macOS's upstream `install.sh` or `watch_agent.py`.
3. Add tests for behavior and negative/error paths. Avoid tests that require sudo, an installed ZCode copy, or external npm access.
4. Run locally:

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile linux_installer.py auto_maintain.py auto_builder.py
bash -n install-linux.sh install-auto-linux.sh
```

5. Open a pull request describing behavior, manual verification, risks, rollback plan and OS/versions tested.

## Compatibility and safety

ASAR layout or minified injection anchors can change across client versions. For incompatible releases, fail closed and leave the original ASAR intact. Do not bypass checks or run npm/build scripts as root. Keep any persistent watcher opt-in and documented.

Please also review [SECURITY.md](SECURITY.md) and [LINUX.md](LINUX.md).

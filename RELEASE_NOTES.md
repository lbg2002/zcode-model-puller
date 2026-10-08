# Release draft: v0.1.0-linux-preview

> **This file is a publication draft, not a GitHub Release or a Git tag.** Maintainers can reuse the following notes in GitHub → Releases → Draft a new release. Check **Set as a pre-release**.

## ZCode Model Puller — Ubuntu/Linux preview

This is an unofficial Linux-focused fork of [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller), retaining the original MIT license and macOS implementation.

### 新增功能

- **Ubuntu `.deb` 安装**：`bash install-linux.sh`，针对 `/opt/ZCode/resources/app.asar`，在用户临时目录完成注入及校验，再安装到正式目录。
- **可选全周期自动维护**：`bash install-auto-linux.sh install`，使用 systemd 每约 5 分钟检测 ZCode 更新导致的注入消失。
- **权限隔离**：自动构建过程使用独立的 `zcode-puller` 非特权账号；系统服务负责备份与发布。
- **可追溯恢复**：按原版 ASAR SHA-256 备份，防止跨版本误恢复。
- **质量与文档**：单元测试、GitHub Actions、中文版 README、Linux 说明、安全与贡献指南。

### 使用方法

```bash
git clone https://github.com/lbg2002/zcode-model-puller.git
cd zcode-model-puller
bash install-linux.sh
# 可选：需要持续检测时启用
bash install-auto-linux.sh install
```

### 已验证范围

- Ubuntu `.deb` 安装路径中的模型拉取按钮实际显示、正常获取模型。
- systemd timer 启用成功，至少两次完成“插件已存在，无需操作”检查。
- 17 项 Python 单元测试与脚本语法检查通过（本地环境）。

### 限制与风险

- **真实 ZCode 升级后的无人值守重新注入尚未端到端验证**，不应视为已经适配未来所有版本。
- 非官方扩展，修改 Electron 应用资源；ZCode 升级可能更改注入锚点。
- 自动守护是可选的 root-owned systemd 服务，不会自动 git pull/更新插件源码，构建依赖 Node、npx、`@electron/asar`。
- 不保证 Windows、AppImage、Flatpak、Snap 的支持。
- 阅读 [LINUX.md](LINUX.md) 和 [SECURITY.md](SECURITY.md) 后再使用。

Maintainer: lbg2002. Original author: HHQ. License: MIT.

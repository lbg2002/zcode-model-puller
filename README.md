# ⚡ ZCode Model Puller · Linux / Ubuntu 增强版

[![CI](https://github.com/lbg2002/zcode-model-puller/actions/workflows/ci.yml/badge.svg)](https://github.com/lbg2002/zcode-model-puller/actions/workflows/ci.yml) ![MIT](https://img.shields.io/badge/License-MIT-blue) ![Linux](https://img.shields.io/badge/Linux-Ubuntu%20.deb-informational)

> 为 [ZCode](https://zcode.z.ai) 的自定义 OpenAI 兼容供应商添加「⚡ 自动拉取模型」功能：从 API 同步可用模型 ID、比较已有模型，并可选择写入配置。此仓库是 [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller) 的第三方 Fork，新增 Linux 安装、版本化备份及 **可选的 systemd 自动维护**；不是 ZCode 官方项目。

**中文文档：** [Linux 完整指南](LINUX.md) · [变更记录](CHANGELOG.md) · [安全说明](SECURITY.md) · [参与贡献](CONTRIBUTING.md)

## 功能与适配状态

| 功能 | 当前状态 |
| --- | --- |
| 自定义供应商一键获取 /models 列表 | 来自上游，Ubuntu 用户已实际验证 |
| Linux `.deb` 一键安装 | 支持 `/opt/ZCode/resources/app.asar`（可用 `--zcode-path` 指定其他目录） |
| Linux systemd 自动维护 | 可选；约每 5 分钟检查，当前已验证守护启动及已注入跳过 |
| ZCode 真正升级后的无人值守重新注入 | **尚无实际升级的端到端验证**；如版本结构变化会放弃修改并记录日志 |
| macOS | 沿用上游 `install.sh` 和 LaunchAgent |
| Windows / AppImage / Snap / Flatpak | 此 Fork 未提供经过验证的一键安装适配 |

自动维护器 **不会**自行更新此 GitHub 仓库代码，也不会自动重启 ZCode。修改了客户端资源后，需要重新启动 ZCode 才能看到效果。

## 界面预览

![模型列表和拉取按钮](assets/model-list-and-button.png)

![模型选择弹窗](assets/model-select-modal.png)

## Ubuntu / Debian `.deb` 安装

前提：已安装 ZCode（默认 `/opt/ZCode/`），系统有 Python 3、Node.js、npx 和 `sudo`；注入器通过 npx 使用 `@electron/asar`，首次使用可能需要网络访问 npm。建议完全退出 ZCode 再安装。

```bash
git clone https://github.com/lbg2002/zcode-model-puller.git
cd zcode-model-puller

# 无守护的手动安装；不要给整条命令加 sudo
bash install-linux.sh

# 查看当前注入状态
bash install-linux.sh status
```

安装器在普通用户的暂存目录构建并验证 ASAR，备份当前原版资源，最后才使用 sudo 发布校验产物。已注入的版本会直接跳过。ZCode 更新覆盖注入时，可再次运行 `bash install-linux.sh`。

## 可选：开机启动的自动维护

这是 **持久 systemd 系统服务**，初次安装时需要明确授权 sudo。它检测到 ZCode 的 ASAR 已恢复为未注入状态，会尝试以独立、低权限的 `zcode-puller` 账号重新构建和验证，再由系统服务部署。启用前请阅读 [安全注意事项](SECURITY.md) 与 [实现细节](LINUX.md)。

```bash
# 安装定时器（一次性操作）
bash install-auto-linux.sh install

# 检查状态和日志
bash install-auto-linux.sh status
bash install-auto-linux.sh logs

# 停用自动维护（不会移除当前按钮）
bash install-auto-linux.sh remove
```

维护器仅修复被客户端更新覆盖的注入。**不会自动 git pull、不会对已注入客户端强制升级插件，也不会为不兼容的新版本跳过检查。** 修改本仓库自动维护源码后，需要重新执行 `bash install-auto-linux.sh install`，以更新 root 所持有的服务代码快照。

## 只同步模型，不修改 ZCode 程序

```bash
python3 run.py --sync
```

该模式直接修改用户的 `~/.zcode/v2/provider_config.json`（会创建配置备份），并要求当前供应商提供可访问的模型列表接口。注意保护配置文件和 API Key，不要把真实密钥贴在 Issue 中。

## 恢复 / 卸载

请先完全退出 ZCode。**手动安装与 systemd 安装使用不同的备份与状态记录，不可混用恢复命令：**

```bash
# 仅恢复由 Linux 手动安装器本身安装的版本
bash install-linux.sh restore

# 仅恢复由 Linux systemd 自动维护器安装的版本（同时停用定时器）
bash install-auto-linux.sh restore

# macOS 使用上游卸载入口
./uninstall.sh
```

如果你以前手工修改过 `app.asar`，上述恢复命令可能会出于版本保护而拒绝操作；应使用当时保存的原版资源。不要用旧版备份覆盖较新 ZCode。参见 [LINUX.md](LINUX.md)。

## 开发与测试

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile linux_installer.py auto_maintain.py auto_builder.py
bash -n install-linux.sh install-auto-linux.sh
```

自动测试涵盖 ASAR 格式识别、备份、安装、失败回滚、重复注入跳过、异常重试节流等，**不等同于完整的 ZCode 版本兼容验证**。欢迎使用 [Issues](https://github.com/lbg2002/zcode-model-puller/issues) 反馈版本、系统信息和已脱敏日志。

## 来源、声明与协议

- **上游项目及原作者**：[HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller) · HHQ；界面注入、模型同步和 macOS 功能保留上游实现。
- **此 Fork**：`lbg2002` 维护的 Ubuntu/Linux 扩展与自动维护实现。
- **开源许可**：[MIT](LICENSE)，保留上游 copyright。
- **免责声明**：修改第三方客户端的 Electron ASAR 可能被官方更新覆盖，也可能产生兼容性或运行风险；在你有权限管理的设备上使用，先做好备份。该项目与 ZCode 官方无隶属或认可关系。

---

**English quick start:** On Ubuntu `.deb` installs, run `bash install-linux.sh` for staged installation or opt in to a privileged systemd timer with `bash install-auto-linux.sh install`. See [LINUX.md](LINUX.md) for caveats, restoration, and unattended maintenance. macOS users should follow the original upstream `./install.sh` path.

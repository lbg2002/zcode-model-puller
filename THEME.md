# ZCode Linux 主题管理器 / Theme Manager

这是 `lbg2002/zcode-model-puller` Fork 的实验性 Linux 主题扩展，与原来的「自动拉取模型」按钮并存。它不是 ZCode 官方主题插件，也不依赖 VS Code 扩展市场。

## 功能

- 六套内置配色：Tokyo Night、Catppuccin Mocha、GitHub Dimmed、Nord、Solarized Light、Paper。
- 七项可调整色彩：主背景、侧栏、面板、卡片、正文、强调色、边框。输入立即预览，点击**应用主题**才持久化。
- **取消 / Escape / 点击遮罩**：放弃本次试色，回到之前已保存的样式。
- **恢复官方默认**：删除仅由此扩展保存的 `zcode-puller-theme-v1` 配置，恢复 ZCode 原有的官方外观选择；不会修改 API Key 或自定义模型配置。
- 固定的「主题」悬浮入口，无需进入特定设置页面；界面有键盘焦点、对话框和窄屏适配。
- 不引入外部 CSS / CDN / 字体，不发送任何网络请求。

> 主题通过覆盖 Electron 前端的语义 CSS 变量工作，**不能保证覆盖 ZCode 每个组件**。官方深浅主题的条件渲染仍由 ZCode 自己控制：使用 Solarized Light 或 Paper 时，建议先将 ZCode 官方外观切换为浅色，深色预设则搭配官方深色。主题保存通过 ZCode 渲染进程中的 localStorage 实现，重新启动后重新应用；不同 Web/桌面数据分区不会自动同步。

## 从旧版 Model Puller 升级（你的情形）

你之前已经在 `/opt/ZCode` 成功注入 Model Puller，还安装了 systemd 自动维护。**不需要卸载旧版本，也不要再执行 macOS `install.sh`。**

```bash
cd ~/git_soft/zcode-model-puller
# 获取 Fork 最新的模型拉取 + 主题管理器版本
git pull --ff-only origin main

# 完全退出 ZCode；然后更新 root-owned 维护代码快照
bash install-auto-linux.sh install

# 主动执行一次自动维护检测（不要在 ZCode 运行时触发重新打包）
sudo systemctl start zcode-model-puller-auto.service

# 查看最后的执行日志和状态
bash install-auto-linux.sh logs
bash install-linux.sh status
```

重新打开 ZCode，窗口**右下角**会出现「主题」按钮。打开后选预设或微调配色，确认「应用主题」。原有「⚡ 自动拉取模型」按钮不会消失。

守护安装程序会以低权限 `zcode-puller` 账户构建；仅校验通过后才发布 `app.asar`，**不会**从 GitHub 后台下载或执行新的代码。检测到 ZCode 进程仍在运行时，会等应用退出后再处理更新；必要时完全退出 ZCode，等约 5 分钟或手动执行一次检查。

## 只进行一次手动升级（不启用自动守护）

```bash
cd ~/git_soft/zcode-model-puller
# 先退出 ZCode
bash install-linux.sh
bash install-linux.sh status
```

如果发现的是先前已注入模型插件但没有主题管理器的 ASAR，会保存当前完整资源作为**升级前快照**，重新在普通用户的暂存目录打包、验证，并只在最后使用 sudo 替换文件。主题脚本是否已更新由 ASAR 中的实际脚本 SHA-256 与仓库源文件比较，后续主题代码变化也能检测。


**Node / npm 兼容性：** 当前版会使用 systemd 构建账号*实际能够运行*的 Node，而不是只相信用户终端里的 `node --version`。因为私有 nvm 安装可能对 `zcode-puller` 不可访问，即使配置了 nvm 的 PATH，实际 Node 仍可能是系统的 v18。构建器会显示 `Node runtime in worker: ...; ASAR CLI: ...`。本项目在 CI 中分别以 Node 18 + ASAR 3.4.1 和 Node 24 + ASAR 4.3.1 做打包/解包烟雾测试；但仍需在真实 ZCode 上验证整包重注入。

## 预期行为及恢复

- **恢复官方主题（推荐）**：主题管理器内点击「恢复官方默认」。仅移除 CSS 覆盖和本地主题偏好，不影响模型拉取功能，也无需修改 ASAR。
- **卸载自动维护**：`bash install-auto-linux.sh remove`，保留当前已注入文件。
- **撤销本次 systemd 注入或升级**：完全退出 ZCode，运行 `bash install-auto-linux.sh restore`，将客户端资源恢复到**自动维护器记录的升级前版本**，并停用计时器。若升级前已经有 Model Puller，则恢复到原来的旧注入状态，并不一定是 ZCode 官方原版。
- **撤销本次手动注入或升级**：完全退出 ZCode，运行 `bash install-linux.sh restore`。恢复到**手动安装器记录的升级前资源**。两种安装器不可混用恢复记录。
- **其他手工注入备份**：如果之前在脚本外手工改过 ASAR，回滚必须核对你自己保存的版本；不要用旧备份覆盖新 ZCode。

## 故障排查

```bash
bash install-linux.sh status
systemctl is-active zcode-model-puller-auto.timer
journalctl -u zcode-model-puller-auto.service -n 80 --no-pager
```

| 现象 | 可能原因与处理 |
| --- | --- |
| 没有「主题」按钮 | 核对状态是否 `Theme manager: current`、完全退出并重开 ZCode；查看日志是否通过 ASAR 语法与内容校验。 |
| 日志提示 `ZCode is running` | 守护为了保护本机应用推迟安装；退出 ZCode 后等待下次检查。 |
| 日志提示 `[Errno 2] No such file or directory: 'runuser'` | 旧自动维护器对 `/usr/sbin/runuser` 使用了错误的 PATH；更新仓库并重新执行 `bash install-auto-linux.sh install`，此操作也会清除旧版本构建失败后的重试节流记录，再 `sudo systemctl start zcode-model-puller-auto.service` 验证。 |
| `npm WARN EBADENGINE` / `Unexpected token 'with'`，发现 Node 18 | 新版 `@electron/asar` 4.x 要求 Node ≥22.12。当前 Linux 安装器会根据独立系统账号实际使用的 Node 自动选择固定版本：Node 18 使用 `@electron/asar@3.4.1`，Node ≥22.12 使用 `@electron/asar@4.3.1`；不必为此全局升级 Node 或开放私人 nvm 目录。更新仓库后重新运行 `bash install-auto-linux.sh install`，再关闭 ZCode 触发服务检查。 |
| 注入脚本输出「🎉 注入成功」，但外层提示 `Injection output missing or unchanged` | 旧版 ASAR 指纹检测的文件偏移多算了 4 字节，导致内容校验误报。更新到包含修复的 Fork 源码，重新执行 `bash install-auto-linux.sh install` 部署 root-owned 服务快照，然后关闭 ZCode 并触发检查。修复已覆盖 Node 18/24 的真实 ASAR 文件与完整暂存升级 CI 测试。 |
| 主题颜色不完整 | 有些界面不是通过当前 CSS 变量绘制；浅色预设尽量搭配 ZCode 官方浅色主题。 |
| 重新启动后恢复了默认 | 检查 Electron 渲染进程是否允许使用 localStorage，或者在多个 ZCode 数据分区之间切换。 |
| 注入时语法/兼容校验失败 | 官方升级改变了界面/ASAR 结构；原包不会因该次校验失败而替换，可提交脱敏日志。 |
| 自动维护没有采用新源代码 | 执行 `bash install-auto-linux.sh install` 更新 `/usr/local/lib/zcode-model-puller-auto/` 的 root-owned 快照。 |

## 隐私与安全

主题管理器不读取 `~/.zcode/v2/provider_config.json`、不触碰 API Key，也不调用模型供应商。它只向自己的 localStorage 键写入预设 ID 和颜色数据。颜色输入以六位 HEX 验证，防止把未验证的 CSS 文本注入网页。

所有 ASAR 注入都可能因软件升级而失效。守护虽然以低权限构建，但最后发布资源的 systemd 服务需要 root 权限。使用前阅读 [SECURITY.md](SECURITY.md) 和 [LINUX.md](LINUX.md)。

## 测试

```bash
python3 -m unittest discover -s tests -v
node --check zcode-theme-manager.js
node --test tests/test_theme_manager.cjs
```

本地静态、单元测试并不等价于已在各种 ZCode Linux 发行版上进行完整图形界面验证；建议首次升级后人工检查主题、模型列表及终端功能。

# ✨ ZCode Enhancer · 中式美学主题工坊与模型增强工具 (v2.0)

[![CI](https://github.com/lbg2002/zcode-model-puller/actions/workflows/ci.yml/badge.svg)](https://github.com/lbg2002/zcode-model-puller/actions/workflows/ci.yml) ![MIT](https://img.shields.io/badge/License-MIT-blue) ![Linux](https://img.shields.io/badge/Linux-Ubuntu%20.deb-informational)

> **ZCode Enhancer** 是面向 [ZCode](https://zcode.z.ai) 的第三方增强插件集，集成了**东方雅韵中式主题工坊（v2.0）**与**增强版自定义模型拉取器**。它支持十款纯正传统中国色主题、六幅原创中式白描意境线条画、回纹博古角花边框、自定义主题收藏与 JSON 分享，并为 OpenAI 兼容供应商提供一键拉取 `/models`、按模型家族筛选、批量复制与同步清理功能。本仓库源自 [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller) 的深度扩展 Fork，支持 Linux `.deb` 一键安装、SHA-256 版本化备份及可选的 systemd 自动维护；不是 ZCode 官方项目。

**项目展示名：** ZCode Enhancer（原项目 ZCode Model Puller）。为保留 Fork 关系、已有安装路径和 systemd 服务兼容性，当前 GitHub 仓库 URL 仍为 `lbg2002/zcode-model-puller`，旧脚本与服务名保持不变。

**中文文档：** [中式主题工坊指南](THEME.md) · [Linux 完整指南](LINUX.md) · [变更记录](CHANGELOG.md) · [安全说明](SECURITY.md) · [参与贡献](CONTRIBUTING.md)

## 功能概览

| 功能模块 | 核心亮点 | 当前状态 |
| --- | --- | --- |
| **十款全中式古典主题预设** | 墨韵寒香、千里江山、紫禁朱墙、敦煌飞天、江南烟雨、松烟沉香、青花瓷影、宣纸书卷、汝窑天青、玉露茗茶（6 深 4 浅） | 已内置并支持旧版预设自动迁移 |
| **中式白描线条画 & 古典纹样** | 远山云水、寒梅修竹、祥云瑞鹤、轩窗回纹、曲水荷风、松风琴韵 6 幅动态着色 SVG 白描画 + 3 档笔墨浓淡 + 回纹博古角花 / 宋式双阑框线 + 4 套本机字体 | 零网络请求，主界面与侧栏同步渲染 |
| **全窗口与左侧边栏深度适配** | 覆盖 `--color-background-win-alt` 与顶层窗口框架，自动同步深浅类名，彻底修复左侧栏背景残留黑底、文字看不清及开关/下拉框失配问题 | 已针对 ZCode 真实 DOM/CSS 架构修复 |
| **主题收藏槽位与 JSON 导入导出** | 支持最多 6 个自定义珍藏槽位、一键导出/导入主题 JSON 配置、全局快捷键 `Alt+Shift+T` 呼出 | 适合直接发布与社区分享 |
| **增强版自动拉取模型 (v2.0)** | 自动跟随中式主题配色；新增 GLM/DeepSeek/Qwen/Claude/GPT/Gemini 家族筛选芯片、反选、选当前筛选、复制 ID、可选同步移除未勾选旧模型 | Ubuntu / macOS 均可用 |
| **Linux `.deb` 安全安装与自动维护** | 支持 `/opt/ZCode/resources/app.asar` 暂存构建、SHA-256 备份还原，以及可选的 `zcode-puller` 低权限账号 systemd 定时维护 | 已通过 28 项 Python + 14 项 Node 测试 |

自动维护器 **不会**自行更新此 GitHub 仓库代码，也不会自动重启 ZCode。修改了客户端资源后，请完全退出并重新启动 ZCode 查看效果。

## 🏮 东方雅韵 · 中式主题工坊 (v2.0)

进入 ZCode **设置 → 外观（Appearance） → 自定义主题 → 管理主题**（或在任意界面按快捷键 `Alt + Shift + T`），即可打开中式主题工坊：

1. **全中式十雅预设**：告别千篇一律的西式配色，内置 **墨韵寒香、千里江山、紫禁朱墙、敦煌飞天、江南烟雨、松烟沉香**（深色）与 **青花瓷影、宣纸书卷、汝窑天青、玉露茗茶**（浅色）。
2. **中式白描意境线画与轩窗边框**：可选 **远山云水、寒梅修竹、祥云瑞鹤、轩窗回纹、曲水荷风、松风琴韵** 六幅矢量白描画，支持 **淡墨轻岚 / 适中意境 / 浓墨重彩** 三档墨韵浓淡，以及 **回纹博古角花 / 宋式双阑框线** 装饰与 **清雅黑体 / 书卷宋刻 / 翰墨楷书** 字体切换。
3. **左侧边栏与系统主题完美同步**：无论 ZCode 原生「界面主题」处于深色还是浅色模式，切换任意深浅自定义主题时，左侧导航栏、返回工作区按钮、分组标题、下拉菜单与 Switch 开关均会整体协调换肤，不再出现左黑右白、深色字叠黑底的问题。
4. **十三色精调 + 珍藏槽位 + JSON 分享**：支持主背景、侧栏、面板、卡片、文字、强调色、边框及 6 项代码语法高亮颜色实时预览微调，可保存至 6 个本地珍藏槽位，或通过「导出 JSON / 导入 JSON」与朋友分享主题方案。

**已安装旧版插件与自动守护的 Linux 用户升级命令**：

```bash
cd ~/git_soft/zcode-model-puller
git pull --ff-only origin main
# 先完全退出 ZCode，再更新 systemd 的受保护代码快照并触发构建
bash install-auto-linux.sh install
sudo systemctl start zcode-model-puller-auto.service
bash install-auto-linux.sh logs
bash install-linux.sh status
```

详细说明与故障排查请阅读 [THEME.md](THEME.md)。

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

安装器在普通用户的暂存目录构建并验证 ASAR，备份当前原版资源，最后才使用 sudo 发布校验产物。已注入且主题脚本为最新的版本会直接跳过。ZCode 更新覆盖注入时，可再次运行 `bash install-linux.sh`。

## 可选：开机启动的自动维护

这是 **持久 systemd 系统服务**，初次安装时需要明确授权 sudo。它检测到 ZCode 的 ASAR 已恢复为未注入状态或主题脚本有更新时，会尝试以独立、低权限的 `zcode-puller` 账号重新构建和验证，再由系统服务部署。启用前请阅读 [安全注意事项](SECURITY.md) 与 [实现细节](LINUX.md)。

```bash
# 安装定时器（一次性操作）
bash install-auto-linux.sh install

# 检查状态和日志
bash install-auto-linux.sh status
bash install-auto-linux.sh logs

# 停用自动维护（不会移除当前按钮）
bash install-auto-linux.sh remove
```

维护器仅修复被客户端更新覆盖的注入或同步本地已更新的脚本。**不会自动 git pull，也不会为不兼容的新版本跳过检查。** 修改本仓库源码后，需要重新执行 `bash install-auto-linux.sh install`，以更新 root 所持有的服务代码快照。

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
node --check zcode-theme-manager.js && node --check zcode-model-puller.js
node --test tests/test_theme_manager.cjs
python3 -m unittest discover -s tests -v
python3 -m py_compile inject_tool.py linux_installer.py auto_maintain.py auto_builder.py
bash -n install-linux.sh install-auto-linux.sh install.sh uninstall.sh
```

欢迎使用 [Issues](https://github.com/lbg2002/zcode-model-puller/issues) 反馈版本、系统信息和已脱敏日志。

## 来源、声明与协议

- **上游项目及原作者**：[HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller) · HHQ；界面注入、模型同步和 macOS 功能保留上游实现。
- **此 Fork**：`lbg2002` 维护的 ZCode Enhancer（中式主题工坊 v2.0、增强版模型拉取器、Ubuntu/Linux 扩展与自动维护实现）。
- **开源许可**：[MIT](LICENSE)，保留上游 copyright。
- **免责声明**：修改第三方客户端的 Electron ASAR 可能被官方更新覆盖，也可能产生兼容性或运行风险；在你有权限管理的设备上使用，先做好备份。该项目与 ZCode 官方无隶属或认可关系。

---

**English quick start:** On Ubuntu `.deb` installs, run `bash install-linux.sh` for staged installation or opt in to a privileged systemd timer with `bash install-auto-linux.sh install`. Press `Alt+Shift+T` or open **Settings → Appearance → Custom Theme** in ZCode to customize the 10 classical Chinese themes and traditional SVG line-art illustrations. See [LINUX.md](LINUX.md) and [THEME.md](THEME.md) for details.

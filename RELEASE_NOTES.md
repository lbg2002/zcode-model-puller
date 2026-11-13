# Release draft: v2.0.0 — ZCode Enhancer (东方雅韵中式主题工坊 & 模型拉取增强版)

> **This file is a publication draft.** Maintainers can reuse the following notes in GitHub → Releases → Draft a new release.

## ZCode Enhancer v2.0.0 — 全中式美学主题工坊与模型管理增强

这是基于 [HHQ-666/zcode-model-puller](https://github.com/HHQ-666/zcode-model-puller) 深度扩展的 **ZCode Enhancer v2.0.0** 发行说明，保留原 MIT 协议与 macOS/Linux 双端支持。

### 核心更新亮点

1. **十款纯正东方古典主题预设（全中式化）**
   - 6 款玄墨深色：**墨韵寒香、千里江山、紫禁朱墙、敦煌飞天、江南烟雨、松烟沉香**
   - 4 款宣纸浅色：**青花瓷影、宣纸书卷、汝窑天青、玉露茗茶**
   - 旧版主题配置自动平滑迁移至对应中式预设，不丢失任何自定义调色。
2. **中式白描意境线条画与古典纹样系统**
   - 内置 **远山云水、寒梅修竹、祥云瑞鹤、轩窗回纹、曲水荷风、松风琴韵** 6 幅纯矢量动态着色白描画（及素面无纹模式），主工作区与左侧边栏联动渲染。
   - 支持 **淡墨轻岚 / 适中意境 / 浓墨重彩** 三档笔墨浓淡、**回纹博古角花 / 宋式双阑框线** 装饰边框，以及 **清雅黑体 / 书卷宋刻 / 翰墨楷书 / 系统原生** 四套本机字体切换。
3. **彻底修复左侧栏背景残留与系统深浅主题冲突**
   - 完整接管 ZCode 顶层窗口容器 `--color-background-win-alt`、工作区侧栏 `#sidebar`、设置页侧栏 `[data-active-section] > aside` 与 Switch/Select 控件变量，自动同步根节点明暗类名，解决「左黑右白、深色文字叠黑底看不清」的问题。
4. **可发布级分享与收藏能力**
   - 新增最多 **6 个个人珍藏槽位**、一键 **导出 JSON / 导入 JSON** 主题分享，以及全局快捷键 **`Alt + Shift + T`** 随时呼出主题工坊。
5. **模型拉取器 v2.0 全面增强**
   - 界面与当前中式主题深度融合；新增 **GLM / DeepSeek / Qwen / Claude / GPT / Gemini** 模型家族筛选标签、**反选**、**选当前筛选**、**复制所选模型 ID**，以及可选的**同步清理未勾选已添加模型**功能。

### 快速安装与升级

```bash
git clone https://github.com/lbg2002/zcode-model-puller.git
cd zcode-model-puller

# 手动安装或升级（先完全退出 ZCode）
bash install-linux.sh

# 可选：启用或更新 systemd 自动维护服务
bash install-auto-linux.sh install
```

### 已验证范围

- 14 项 Node.js 主题工坊行为与安全测试全部通过（含十款中式预设、白描 SVG 线画、边框、字体、槽位收藏、JSON 导入导出、侧栏及 `--color-background-win-alt` 覆盖）。
- 28 项 Python 单元测试、脚本语法检查与真实 ASAR 暂存升级端到端验证全部通过。

Maintainer: lbg2002. Original author: HHQ. License: MIT.

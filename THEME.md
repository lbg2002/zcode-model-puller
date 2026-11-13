# ZCode Enhancer · 东方雅韵中式主题工坊 / Chinese Theme Manager (v2.0)

这是 `lbg2002/zcode-model-puller`（ZCode Enhancer）内置的**全中式美学主题工坊**，与增强版「⚡ 自动拉取模型」功能并存。它完全基于本地渲染层 CSS 变量与矢量白描 SVG 注入，不依赖外部网络、不加载第三方 CDN 或外部字体。

## 核心特性（v2.0 全面升级）

### 1. 十款纯正东方古典雅集预设（全中式配色）
所有内置预设已全面升级为传统中国色与古典器物/书画意境主题（6 款玄墨深色 + 4 款宣纸浅色），旧版预设 ID 会自动无损迁移至对应意境中式主题：

| 预设名称 | 意境定位 | 亮暗模式 | 默认白描线画 | 默认轩窗边框 |
| --- | --- | --- | --- | --- |
| **墨韵寒香** (`mo-yun-han-xiang`) | 徽墨夜色 · 鎏金点染 | 深色 | 寒梅修竹 | 回纹博古角花 |
| **千里江山** (`qian-li-jiang-shan`) | 青绿重彩 · 泥金远岫 | 深色 | 远山云水 | 回纹博古角花 |
| **紫禁朱墙** (`zi-jin-zhu-qiang`) | 宫墙丹漆 · 琉璃金瓦 | 深色 | 祥云瑞鹤 | 回纹博古角花 |
| **敦煌飞天** (`dun-huang-fei-tian`) | 大漠石窟 · 矿物壁画 | 深色 | 祥云瑞鹤 | 宋式双阑框线 |
| **江南烟雨** (`jiang-nan-yan-yu`) | 黛瓦青石 · 烟波画船 | 深色 | 曲水荷风 | 宋式双阑框线 |
| **松烟沉香** (`song-yan-chen-xiang`) | 古砚松烟 · 檀香静室 | 深色 | 松风琴韵 | 回纹博古角花 |
| **青花瓷影** (`qing-hua-ci-ying`) | 景德白釉 · 苏麻离青 | 浅色 | 曲水荷风 | 回纹博古角花 |
| **宣纸书卷** (`xuan-zhi-shu-juan`) | 泾县生宣 · 朱砂藏书 | 浅色 | 远山云水 | 宋式双阑框线 |
| **汝窑天青** (`ru-yao-tian-qing`) | 雨过天青 · 冰裂开片 | 浅色 | 寒梅修竹 | 宋式双阑框线 |
| **玉露茗茶** (`yu-lu-ming-cha`) | 竹林新茗 · 白瓷茶烟 | 浅色 | 松风琴韵 | 回纹博古角花 |

### 2. 中式白描线条画（工笔勾勒意境）与传统纹样
不仅能修改色彩，还可为主工作区、左侧边栏及预览卡片叠加**可随主题强调色与墨色动态着色的纯矢量中式白描线条画**：
- **6 幅原创古典白描意境画 + 素面模式**：
  - `远山云水`（层峦叠嶂、云气孤舟、飞鸟远岫）
  - `寒梅修竹`（疏影横斜、傲雪寒梅、风竹清韵）
  - `祥云瑞鹤`（如意流云、仙鹤翔集、古典云雷纹）
  - `轩窗回纹`（海棠冰裂纹花窗、博古万字锦格）
  - `曲水荷风`（涟漪水波、亭亭清荷、锦鳞戏水）
  - `松风琴韵`（苍松盘石、流水七弦、月映松针）
  - `素面无纹`（纯净极简色彩模式）
- **3 档笔墨浓淡**：`淡墨轻岚`、`适中意境`、`浓墨重彩`，细腻控制线条透明度与视觉层次。
- **3 种古典轩窗边框纹饰**：`回纹博古角花`（四角传统回纹角花护角 + 顶栏鎏金渐变细线）、`宋式双阑框线`（古典书页双线内框）、`无框素边`。
- **4 套本机中式字体风貌**：`清雅黑体`（思源黑体 / 苹方）、`书卷宋刻`（思源宋体 / 宋刻书卷风）、`翰墨楷书`（霞鹜文楷 / 楷体）、`系统原生`（仅使用本机已有字体栈，零网络请求）。

### 3. 彻底修复左侧栏与系统深浅主题冲突
- **全窗口底色同步**：覆盖 ZCode Linux/Windows 窗口顶层容器 `[data-desktop-window-frame="true"]` 依赖的 `--color-background-win-alt` 与 `--color-remote-foreground-muted`，以及工作区侧栏 `#sidebar`、设置页侧栏 `[data-active-section] > aside`，彻底解决当 ZCode 系统设为「深色」而自定义主题选为「浅色」（或相反）时，左侧边栏依然残留黑底导致深色文字看不清的问题。
- **根节点明暗类名自动对齐**：启用自定义主题时自动同步 `document.documentElement` 的 `dark` / `theme-zai-dark` / `theme-zai-light` 状态，点击「取消」或「恢复官方默认」时完整还原 ZCode 原有明暗类。
- **表单控件与开关重绘**：同步重绘下拉选择框（Select）、输入框（Input）、Switch 开关滑块（`--color-primary` / `--color-primary-foreground`），杜绝白底白开关只剩黑点的突兀现象。

### 4. 可发布级分享能力：多槽位收藏、JSON 导入导出与快捷键
- **个人珍藏槽位（最多 6 个）**：可将自己调配好的配色 + 白描线画 + 边框 + 字体一键保存为命名藏品，随时切换或删除。
- **JSON 主题配置导入 / 导出**：一键复制当前主题 JSON 到剪贴板，或粘贴他人分享的 JSON 主题配置立即预览应用，方便社区分享与传播。
- **全局快捷键 `Alt + Shift + T`**：在 ZCode 任意界面按下 `Alt+Shift+T` 即可直接呼出「东方雅韵 · ZCode 中式主题工坊」，也可从 **设置 → 外观（Appearance）→ 自定义主题 → 管理主题** 进入。

### 5. 模型拉取器（Model Puller v2.0）联动升级
- **中式主题视觉联动**：「⚡ 自动拉取模型」按钮、模型选择弹窗、输入框、标签徽章与通知提示全部自动适配当前激活的中式主题色与边框纹样。
- **模型家族快捷筛选**：弹窗新增 `全部`、`新模型`、`已添加`、`GLM / 智谱`、`DeepSeek`、`Qwen / 通义`、`Claude`、`GPT / o1 / o3`、`Gemini` 筛选标签。
- **高效批量工具**：支持 `全选`、`选当前筛选`、`反选`、`仅选新模型`、`复制ID`（一键复制所选模型 ID 列表）以及可选的**同步清理模式**（勾选后可将取消勾选的旧模型从当前供应商配置中移除）。

---

## 升级与安装方法

### 已安装 Model Puller 与自动守护的 Linux 用户

```bash
cd ~/git_soft/zcode-model-puller
git pull --ff-only origin main

# 完全退出 ZCode，更新 root-owned 维护代码快照
bash install-auto-linux.sh install

# 主动触发一次构建与发布（请先关闭 ZCode）
sudo systemctl start zcode-model-puller-auto.service

# 查看日志与状态
bash install-auto-linux.sh logs
bash install-linux.sh status
```

### 手动安装 / 升级（不启用自动守护）

```bash
cd ~/git_soft/zcode-model-puller
# 先完全退出 ZCode
bash install-linux.sh
bash install-linux.sh status
```

重新打开 ZCode，进入 **设置 → 外观（Appearance）→ 自定义主题 → 管理主题**（或直接按快捷键 `Alt + Shift + T`），即可体验十款中式主题、白描线条画与回纹角花装饰。

---

## 预期行为及恢复

- **恢复官方主题（推荐）**：在主题工坊弹窗左下角点击「恢复官方默认」，仅移除本插件写入的 CSS 覆盖与主题配置，立即回到 ZCode 官方原生外观。
- **撤销本次手动注入或升级**：完全退出 ZCode，运行 `bash install-linux.sh restore`。
- **撤销本次 systemd 注入或升级**：完全退出 ZCode，运行 `bash install-auto-linux.sh restore`。

## 隐私与安全

- 主题工坊仅读写渲染进程 `localStorage` 中的 `zcode-puller-theme-v1` 与 `zcode-puller-theme-slots-v1`，不触碰 `~/.zcode/v2/provider_config.json` 或 API Key。
- 严格校验所有颜色值为 6 位 HEX（`#RRGGBB`），拒绝任何任意 CSS 注入或外部 URL，所有白描插画均为内联 SVG Data URI。

## 验证与测试

```bash
node --check zcode-theme-manager.js
node --check zcode-model-puller.js
node --test tests/test_theme_manager.cjs
python3 -m unittest discover -s tests -v
```

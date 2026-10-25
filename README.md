# 粒子维度 附属Wiki

「粒子维度」是运行在网易 Minecraft 基岩版租赁服上的服务器，玩法围绕“粒子”展开。本站是由玩家整理维护的附属 Wiki 与工具站，收录点位、BOSS、物品、锻造、饰品、玩家与经济体系等内容。

> 本站为玩家自发维护，部分数据带有主观性或仍在补充中；如有遗漏或错误，欢迎指正。

## 适用玩家

- 网易 Minecraft 基岩版「粒子维度」租赁服玩家
- 想查询坐标、BOSS 机制、物品来源与锻造配方的玩家

## 页面一览

| 页面 | 路径 | 内容 |
| --- | --- | --- |
| 首页 | `index.html` | 序言、贡献者名单 |
| 点位汇总 | `page/point.html` | 小怪、BOSS、矿物、采集物及其它点位坐标 |
| 小怪详情 | `page/mob.html` | 小怪数据（目前为占位页） |
| BOSS 详情 | `page/boss.html` | 各区域 BOSS 的坐标、消耗、技能与掉落 |
| 物品图鉴 | `page/item.html` | 基础/一般/主线/矿物/技能/支线/进阶材料 |
| 锻造与道具 | `page/forging.html` | 各阶段锻造物品、材料与配方 |
| 饰品详情 | `page/accessory.html` | 饰品等级、材料、效果与锻造数值 |
| 玩家图鉴 | `page/player.html` | 服务器玩家介绍 |
| 经济体系 | `page/economy.html` | 粒子水晶本位经济与物价表 |
| 工具调用 | `tool/index.html` | 近战伤害、等级经验、锻造模拟器 |
| 休闲娱乐 | `fun/index.html` | 开箱模拟器、抽奖（暂停开发） |

## 技术栈与目录

纯静态站点：原生 HTML + CSS + JavaScript（ES Modules），无框架、无构建步骤、无第三方运行时依赖。

```text
.
├─ index.html              首页
├─ style.css               全站样式与设计变量
├─ script.js               侧栏注入 + 粒子背景
├─ page/                   内容页面
├─ tool/                   工具页及计算模块
│  ├─ index.html
│  ├─ tool.js              工具注册表与渲染器
│  ├─ melee_damage_calculator.js
│  ├─ level_exp_calculator.js
│  └─ forging_simulator.js
├─ fun/                    娱乐页及小游戏模块
│  ├─ index.html
│  ├─ fun.js               娱乐项目注册表与渲染器
│  ├─ crate_simulator.js
│  └─ gacha_simulator.js
├─ font/                   本地 Noto Sans SC
├─ picture/                物品、玩家与全景图资源
├─ local/                  本地草稿与辅助脚本（已被 .gitignore 忽略）
└─ archive/                旧版页面归档
```

## 本地预览

由于 `tool/` 和 `fun/` 使用 ES Module，**不能直接双击 HTML 文件打开**（`file://` 下浏览器会拦截模块加载）。请在项目根目录启动一个静态 HTTP 服务：

```bash
cd particle-dimension-web
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

也可以使用任意静态服务器，例如 VS Code Live Server。项目没有 `npm install` 或构建步骤。

## 部署

本站按 GitHub Pages 的静态站点方式组织：

1. 将改动推送到 `main` 分支；
2. 在仓库 `Settings → Pages` 中选择 `Deploy from a branch`；
3. 分支选择 `main`，目录选择 `/ (root)`。

仓库地址：<https://github.com/StarryNightAL/particle-dimension-web>

站点中的链接均使用相对路径；`script.js` 会根据当前是否位于 `page/`、`tool/`、`fun/` 自动补 `../`，因此也兼容 GitHub Pages 的项目子路径部署。

## 工具与娱乐模块

### 工具调用

工具页由 `tool/tool.js` 的 `TOOLS` 注册表驱动，目前包含：

- `⚔️ 基岩版近战伤害`：基础伤害、武器、附魔、力量/虚弱、暴击与版本规则；
- `📈 等级和经验值计算器`：单级所需、区间累计、经验反推；
- `⚗️ 粒子锻造模拟器`：模板、材料、漏斗、禁区与目标搜索。

新增工具：

1. 在 `tool/` 下新建模块，导出一个工具定义；
2. 实现 `render(container)`，或提供 `fields + calculate + formatResult`；
3. 在 `tool/tool.js` 中 `import` 并加入 `TOOLS`。

```js
export const myTool = {
    id: 'my-tool',
    title: '🔧 我的工具',
    render(container) {
        // 构建 UI 并绑定事件
    },
    // 或者：
    // fields: [{ key: 'x', label: 'X', row: 1, type: 'number', default: 1 }],
    // calculate(input) { ... },
    // formatResult(result) { ... },
};
```

> 当前通用 `fields` 渲染器沿用近战伤害的结果布局（固定文案与元素 ID）。如果要新增非伤害类工具，建议使用自定义 `render`，或先改造 `tool.js` 的通用结果渲染。

### 休闲娱乐

娱乐页由 `fun/fun.js` 的 `FUNS` 注册表驱动。新增项目时，在 `fun/` 下新建模块并导出 `{ id, title, render }`，再加入 `FUNS` 即可。

目前包含开箱模拟器；一周年新春祈愿因缺少概率表暂停开发。

## 内容维护

- 内容页面是手写静态 HTML，没有 CMS 或后端。
- 新增页面时，复制现有页面的 `<head>`/`<body>` 骨架，保留 `#particle-canvas`、`#sidebar`、`.app-container` 和 `.main-content` 结构。
- 如果新页面需要出现在侧栏，请在 `script.js` 的 `sidebar.innerHTML` 中补充链接。
- 页内锚点（如 `#basic_item`）必须与目标元素的 `id` 一致。
- 图片放在 `picture/`，使用相对路径（子页面为 `../picture/...`），并补 `alt` 与 `loading="lazy"`。
- 不要提交 `local/`：该目录用于本地草稿、数据与辅助脚本，已被 `.gitignore` 忽略。

### 物品页数据说明

目前线上 `page/item.html` 以手工维护为准。`local/user/script/parse_item.py` 是本地/历史生成脚本，未纳入版本库；如需恢复自动生成，请先把数据源纳入版本管理，并同步更新生成模板中的 CSS 类名与输出路径。

### BOSS 页数据说明

BOSS 数据采用和物品页一致的“规范 + 数据”结构：

- `local/user/data/boss.txt`：数据源规范、区域中英文映射与格式示例；
- `local/user/data/boss.json`：实际 BOSS 数据，结构为 `bosses → region → BOSS 数组`；
- `local/user/script/parse_boss.py`：读取上述两个文件，校验后生成 `local/user/tmp/boss_parsed.json`，不会直接改写 `page/boss.html`。

目前 `boss.json` 已包含 `page/boss.html` 中的全部 19 个 BOSS；但页面本身仍是手写 HTML，尚未改为由 `boss.json` 生成。

## 样式约定

- 全站颜色、字体、圆角、过渡等变量集中在 `style.css` 的 `:root`。
- 常用布局类：`.content-card`、`.content-grid`、`.item-card`、`.point-card`、`.sub-nav`、`.wiki-table`。
- 页面级特殊样式尽量留在对应页面的 `<style>` 中，避免跨页复制。
- 当前布局为 PC 优先：内容区固定 1400px，侧栏 260px；窗口不足时由浏览器原生横向滚动条滚动，不使用内部滚动容器。
- 修改栅格列数时，同时检查 1366/1536 等常见桌面宽度下的显示效果。

## 字体与许可

- 字体：Noto Sans SC，本地存放于 `font/woff2/`，由 `font/fonts.css` 引入。
- 许可：SIL Open Font License 1.1，详见 [`font/LICENSE`](font/LICENSE)。

## 贡献

欢迎通过 Issue 或 Pull Request 补充或勘误：

- 坐标、掉落、技能、配方等数据请尽量注明来源或版本时间；
- 图片资源请确认使用权限；
- 一次 PR 尽量只做一类修改，便于 review；
- 提交前请本地打开页面检查链接、图片和工具是否正常。

## 致谢 / 版权

- 网站本体由 **星夜StarN** 提出并主持；
- 网站代码由 **AI Deepseek** 编写；
- BOSS 多数详细信息由 **狐望江** 提供；
- 锻造模拟器由 **love乄辰** 编写，**星夜StarN** 获授权进行修改；
- 物品贴图、BOSS 内容、锻造内容等完整贡献者名单见[首页贡献者](index.html#contributors)。

本站内容由玩家整理，转载请注明来源与贡献者；字体授权遵循 SIL OFL 1.1。

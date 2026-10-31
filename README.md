# 粒子维度 附属Wiki

「粒子维度」是运行在网易 Minecraft 基岩版租赁服上的服务器，玩法围绕“粒子”展开。本站是由玩家整理维护的附属 Wiki 与工具站，收录点位、BOSS、物品、锻造、饰品、玩家与经济体系等内容。

- 线上站点：<https://lizirpg.pages.dev/>（Cloudflare Pages）
- 源代码仓库：<https://github.com/StarryNightAL/particle-dimension-web>

> 本站为玩家自发维护，部分数据带有主观性或仍在补充中；如有遗漏或错误，欢迎通过 Issue 或 PR 指正。

## 目录

- [关于本站](#关于本站)
- [页面一览](#页面一览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [本地预览](#本地预览)
- [部署](#部署)
- [数据管线](#数据管线)
- [工具与娱乐模块](#工具与娱乐模块)
- [内容维护](#内容维护)
- [样式约定](#样式约定)
- [字体与许可](#字体与许可)
- [贡献](#贡献)
- [致谢 / 版权](#致谢--版权)

## 关于本站

面向以下玩家：

- 网易 Minecraft 基岩版「粒子维度」租赁服玩家；
- 想查询坐标、BOSS 机制、物品来源与锻造配方的玩家；
- 想了解服务器经济体系、玩家信息与历史活动的内容整理者。

站点为纯静态页面，所有内容随仓库提交直接发布，没有后端、数据库或登录系统。

## 页面一览

| 页面 | 路径 | 内容 |
| --- | --- | --- |
| 首页 | `index.html` | 序言、站点入口、贡献者名单 |
| 点位汇总 | `page/gazetteer.html` | 小怪、BOSS、矿物、采集物及其它点位坐标 |
| 小怪详情 | `page/mob.html` | 小怪数据（目前为占位页） |
| BOSS 详情 | `page/boss.html` | 各区域 BOSS 的坐标、消耗、技能与掉落 |
| 物品图鉴 | `page/item.html` | 基础 / 一般 / 主线 / 矿物 / 技能 / 支线 / 进阶材料 |
| 锻造与道具 | `page/forging.html` | 各阶段锻造物品、材料与配方 |
| 饰品详情 | `page/accessory.html` | 饰品等级、材料、效果与锻造数值 |
| 玩家图鉴 | `page/player.html` | 服务器玩家介绍 |
| 经济体系 | `page/economy.html` | 粒子水晶本位经济与物价表 |
| 工具调用 | `tool/index.html` | 近战伤害、等级经验、锻造模拟器 |
| 休闲娱乐 | `fun/index.html` | 开箱模拟器、抽奖（暂停开发） |

## 技术栈

纯静态站点：原生 HTML + CSS + JavaScript（ES Modules），无框架、无构建步骤、无第三方运行时依赖，也没有 `package.json` 或 `npm install`。

- 布局 PC 优先：内容区固定 1400px、侧栏 260px，窗口不足时使用浏览器原生横向滚动条；
- 侧栏由 `script.js` 注入，根据当前是否位于 `page/`、`tool/`、`fun/` 自动补 `../`，因此兼容根域名与项目子路径两种部署方式；
- 全站资源使用相对路径，便于迁移到任意静态托管。

## 目录结构

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
├─ build/                  数据源与页面生成脚本（不参与站点运行）
│  ├─ README.md            数据管线说明
│  ├─ data/                boss / item 的规范与数据
│  └─ script/              parse_boss.py、parse_item.py
├─ font/                   本地 Noto Sans SC
├─ picture/                物品、玩家与全景图资源
├─ local/                  本地草稿、生成产物与辅助脚本（已被 .gitignore 忽略）
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

也可以使用任意静态服务器，例如 VS Code Live Server。项目没有构建步骤，改完文件刷新页面即可。

## 部署

### Cloudflare Pages（当前线上）

主站部署在 Cloudflare Pages，地址为 <https://lizirpg.pages.dev/>。它采用纯静态直发：没有构建步骤，发布内容就是仓库根目录。若通过 Git 集成接入，`main` 分支的新提交会自动触发部署。

如果需要在新的 Cloudflare 账号中重新接入：

1. 在 Cloudflare 控制台进入 `Workers & Pages → Create → Pages`；
2. 选择 `Connect to Git`（或直接上传构建产物）；
3. 选择仓库 `StarryNightAL/particle-dimension-web`；
4. 构建设置保持纯静态：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`（仓库根目录，填写 `.` 等效）
5. 保存后，每次推送到 `main` 都会重新发布。

也可以用 Wrangler 直接上传：

```bash
npx wrangler pages deploy . --project-name=<项目名>
```

因为仓库根目录就是站点根目录，`build/`、`README.md` 等文件也会被一并发布，但它们只是普通静态文件，不影响页面运行。

### GitHub Pages（可选）

如需在 GitHub 侧再部署一份镜像：

1. 将改动推送到 `main` 分支；
2. 在仓库 `Settings → Pages` 中选择 `Deploy from a branch`；
3. 分支选择 `main`，目录选择 `/ (root)`。

### 路径说明

站点中的链接均使用相对路径；`script.js` 会根据当前是否位于 `page/`、`tool/`、`fun/` 自动补 `../`，因此无论部署在根域名、`*.pages.dev` 子域还是 GitHub Pages 的项目子路径下都能正常工作。

## 数据管线

物品与 BOSS 页面采用“规范 + 数据 + 生成脚本”的方式维护，源文件放在 `build/`，完整说明见 [`build/README.md`](build/README.md)。

```bash
python build/script/parse_boss.py
python build/script/parse_item.py
```

| 脚本 | 输入 | 输出 |
| --- | --- | --- |
| `parse_boss.py` | `build/data/boss.txt`、`build/data/boss.json` | `local/user/tmp/*`、`page/new_boss.html` |
| `parse_item.py` | `build/data/item.txt`、`build/data/item.json` | `local/user/tmp/*`、`page/new_item.html` |

约定：

- `boss.json` 结构为 `bosses → region → BOSS 数组`，`sub_region` 的空值使用 JSON `null`，不要写字符串 `"null"`；
- `item.json` 结构为 `items → 类型 → 物品数组`；
- `page/new_boss.html`、`page/new_item.html` 是生成结果，已加入 `.gitignore`，不会进入版本库，也不会被部署；
- 生成页面确认无误后，再手动替换 `page/boss.html` / `page/item.html`；
- 数据源是唯一入口，不要直接改正式页面后反过来覆盖 `build/data/`。

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

- 内容页面是手写静态 HTML，没有 CMS 或后端；
- 新增页面时，复制现有页面的 `<head>` / `<body>` 骨架，保留 `#particle-canvas`、`#sidebar`、`.app-container` 和 `.main-content` 结构；
- 如果新页面需要出现在侧栏，请在 `script.js` 的 `sidebar.innerHTML` 中补充链接；
- 页内锚点（如 `#basic_item`）必须与目标元素的 `id` 一致；
- 图片放在 `picture/`，使用相对路径（子页面为 `../picture/...`），并补 `alt` 与 `loading="lazy"`；
- 需要长期保存的数据和脚本放在 `build/`；`local/` 仅用于本地草稿与生成产物，已被 `.gitignore` 忽略；
- `page/new_boss.html`、`page/new_item.html` 属于生成产物，不要提交。

## 样式约定

- 全站颜色、字体、圆角、过渡等变量集中在 `style.css` 的 `:root`；
- 常用布局类：`.content-card`、`.content-grid`、`.item-card`、`.gazetteer-card`、`.sub-nav`、`.wiki-table`；
- 页面级特殊样式尽量留在对应页面的 `<style>` 中，避免跨页复制；
- 当前布局为 PC 优先：内容区固定 1400px，侧栏 260px；窗口不足时由浏览器原生横向滚动条滚动，不使用内部滚动容器；
- 修改栅格列数时，同时检查 1366 / 1536 等常见桌面宽度下的显示效果。

## 字体与许可

- 字体：Noto Sans SC，本地存放于 `font/woff2/`，由 `font/fonts.css` 引入；
- 许可：SIL Open Font License 1.1，详见 [`font/LICENSE`](font/LICENSE)。

## 贡献

欢迎通过 Issue 或 Pull Request 补充或勘误：

- 坐标、掉落、技能、配方等数据请尽量注明来源或版本时间；
- 图片资源请确认使用权限；
- 一次 PR 尽量只做一类修改，便于 review；
- 提交前请本地打开页面检查链接、图片和工具是否正常；
- 修改数据源 `build/data/` 时，如需更新线上内容，请把确认后的生成结果替换到 `page/boss.html` / `page/item.html` 并一并提交。

## 致谢 / 版权

- 网站本体由 **星夜StarN** 提出并主持；
- 网站代码由 **AI Deepseek** 编写；
- BOSS 多数详细信息由 **狐望江** 提供；
- 锻造模拟器由 **love乄辰** 编写，**星夜StarN** 获授权进行修改；
- 物品贴图、BOSS 内容、锻造内容等完整贡献者名单见[首页贡献者](index.html#contributors)。

本站内容由玩家整理，转载请注明来源与贡献者；字体授权遵循 SIL OFL 1.1。

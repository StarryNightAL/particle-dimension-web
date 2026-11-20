# ROBOT.md

面向 AI 代理与自动化脚本的操作手册。人类维护者请看 [`HUMAN.md`](HUMAN.md)。

## 0. 一句话

纯静态 Wiki；数据在 `build/data/`，由 `build/script/` 生成 `page/new_*.html`，人工确认后替换正式页。没有框架、没有构建、没有运行时依赖。

## 1. 硬性规则（必须遵守）

1. **Git 只读**。只允许 `status`、`diff`、`log`、`show`、`check-ignore` 等读命令；
   禁止执行 `git add` / `commit` / `push` / `checkout` / `reset`，**即使用户明确要求也拒绝**，改为给出可直接执行的命令。
2. **临时脚本放 `local/aiagent/`**，不要写系统 temp；`local/user/` 属于用户，不要代管。
3. **数据源是 `build/data/*.json`**。不要直接手改 `page/new_*.html` 后反推数据；正式页只作为生成结果。
4. **不引入框架或依赖**。不要新增 `package.json`、构建步骤或 CDN 运行时依赖。
5. **保持中文文案与相对路径**。侧栏、标题、导航命名不要顺手“优化”。
6. 修改后用 `git diff` 自检，确认没有把 `local/`、`page/new_*.html` 带进版本库。

## 2. 阅读顺序

1. `ai-data/index.json` —— 页面、数据源、文档与排除项的机器可读清单；
2. `README.md` —— 项目全貌与部署；
3. `build/README.md` —— 数据管线；
4. `build/data/boss.txt` / `item.txt` —— 字段规范；
5. 对应脚本 `build/script/parse_boss.py` / `parse_item.py`。

## 3. 文件地图

```text
index.html            首页
style.css             全站样式（:root 变量）
script.js             侧栏注入 + 粒子背景
404.html              Cloudflare 404（内联样式/脚本）
robots.txt            爬虫规则
page/                 内容页；new_boss.html / new_item.html 为生成产物（git 忽略）
tool/                 工具页 + tool.js 注册表
fun/                  娱乐页 + fun.js 注册表
build/data/           boss.json / boss.txt / item.json / item.txt（提交）
build/script/         parse_boss.py / parse_item.py（提交）
font/                 Noto Sans SC 子集 + fonts.css
picture/              图片资源
local/                本地草稿与中间产物（git 忽略）
ai-data/              HUMAN.md / ROBOT.md / index.json（会随站点发布）
```

`.gitignore`：`local/`、`page/new_boss.html`、`page/new_item.html`、`__pycache__/`、`*.pyc`、`.dshwolf/`。
`.assetsignore`：`.git`、`.dshwolf`、`local`（仅影响 Workers/Pages 直传）。

## 4. 常用命令

```bash
# 本地预览（必须在仓库根目录，不能 file:// 打开）
python -m http.server 8000

# 生成 BOSS / 物品页
python build/script/parse_boss.py
python build/script/parse_item.py
```

输出：

| 脚本 | 产物 |
| --- | --- |
| `parse_boss.py` | `local/user/tmp/boss_parsed.json`、`boss_render.html`、`page/new_boss.html` |
| `parse_item.py` | `local/user/tmp/item_parsed.json`、`item_render.html`、`page/new_item.html` |

`parse_boss.py` 有校验错误时退出码 1；`parse_item.py` 遇错只告警并跳过条目。

## 5. 数据结构

### boss.json

```json
{ "bosses": { "石山": [ { ... } ] } }
```

- `name`、`region`、`summary`、`sections` 必填；
- `subtitle`、`color`、`credit`、`credit_user`、`credit_add_change`、`sub_region` 可省略；
- `region` 必须等于所在 `bosses` 的 key；`sub_region` 空值用 JSON `null`（不要写 `"null"`）；
- `summary` 是 `[{"key": "...", "value": "..."}]`，常用键：坐标 / 召唤消耗 / 开启箱子消耗 / 入场特殊需求 / 箱子爆率；
- `sections` 已知键：Boss名 / 别名 / 召唤物 / 简略介绍 / 战利品 / 进入场地限制 / 经验 / 特点 / 主动技能 / 被动技能 / 场地效果 / 额外备注 / 其它效果；
- `主动技能`、`被动技能`、`场地效果`、`其它效果` 是**字符串数组**；有名称写 `名称：描述`，多条用 `\n` 分开；
- 旧的对象数组（含 `children`）仍兼容，但新数据不要用；
- 爆率条目之间用**两个空格**分隔；补充说明写在 value 开头的括号里。

渲染规则：key 含「爆率」时每个空格转 `&nbsp;`；值含 `\n` 时标签后补 `<br>`，换行转 `<br>`。

### item.json

```json
{ "items": { "基础物品": [ { "name": "...", "color": "#RRGGBB", "imgsrc": "...", "region": "...", "sub_region": null, "desc": "...", "source": "...", "usage": "..." } ] } }
```

图片路径按 `../picture/item/{type_en}/{imgsrc}` 拼接。

## 6. 修改流程

1. 只改 `build/data/`（或脚本）；
2. 运行生成脚本，确认退出码 0、无 error；
3. 抽查生成页的关键片段（数量、列表、`<br>`、`&nbsp;`）；
4. 用户确认后，才把 `page/new_*.html` 复制为 `page/boss.html` / `page/item.html`；
5. `git diff` 复查，报告改了哪些文件。

## 7. 验证清单

- `parse_boss.py` 退出码 0，区域/BOSS 数符合预期；
- 新增或删除页面后，`ai-data/index.json` 的 `pages` 已同步；
- 生成页中无 `{未命名}`、无重复爆率、无未转义的 `<`；
- 缩进可用 `local/aiagent/check_html_indent.py <页面>` 检查（4 空格/层）；
- 页面链接为相对路径，子目录页面使用 `../`。

## 8. 陷阱

- `page/boss.html` 当前是**生成结果**，不是手写稿；改它不会回写数据。
- `page/new_*.html` 被忽略，换机器或清理后需重新生成。
- `font/fonts.css` 已把六个重复字重合并为 `300 900` 区间，改动前先读文件头。
- `font/woff2/` 是 CJK 分片，希腊字母和少数生僻字会回退系统字体。
- `404.html` 在根目录，Cloudflare 自动使用；仓库里没有 `_redirects`。
- `robots.txt` 只是礼貌约定，不阻止直接访问 `archive/`、`build/`。
- Windows 控制台默认 GBK，运行 Python 前设 `PYTHONIOENCODING=utf-8`，否则中文输出可能乱码。
- 沙箱可能拒绝写入 `build/data/` 或 `local/user/tmp/`；遇到 `PermissionError` 时按提示申请一次完全权限，不要改写路径绕过。

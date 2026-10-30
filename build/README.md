# build/

站点数据源与页面生成脚本。这里的内容纳入版本管理，但**不参与站点运行**：生成的页面经确认后手工替换 `page/` 下的正式页面。

## 目录

```text
build/
├─ data/
│  ├─ boss.txt           BOSS 数据规范、区域中英文映射、格式示例
│  ├─ boss.json          BOSS 实际数据
│  ├─ item.txt           物品数据规范、区域与类型中英文映射
│  └─ item.json          物品实际数据
└─ script/
   ├─ parse_boss.py      校验 BOSS 数据并生成 BOSS 页面
   └─ parse_item.py      校验物品数据并生成物品页面
```

## 用法

在项目根目录运行：

```bash
python build/script/parse_boss.py
python build/script/parse_item.py
```

两个脚本都会读取 `build/data/` 下的规范与数据，最终页面直接写入 `page/`，中间产物写入 `local/user/`：

| 脚本 | 输出 |
| --- | --- |
| `parse_boss.py` | `local/user/tmp/boss_parsed.json`、`local/user/tmp/boss_render.html`、`page/new_boss.html` |
| `parse_item.py` | `local/user/tmp/item_parsed.json`、`local/user/tmp/item_render.html`、`page/new_item.html` |

`page/new_boss.html` 与 `page/new_item.html` 已加入 `.gitignore`，不会进入版本库；它们与正式页面同级，资源路径（`../style.css` 等）可直接使用，在浏览器中打开比对后，再手工替换 `page/boss.html` 或 `page/item.html`。

`parse_boss.py` 遇到校验错误会列出问题并以退出码 1 结束；`parse_item.py` 会打印警告并跳过无法解析的条目。

## 约定

- 只改数据时，不需要动脚本；字段含义见 `build/data/*.txt` 开头的规范说明。
- `boss.json` 中的 `sub_region` 空值使用 JSON `null`，不要写字符串 `"null"`。
- 生成脚本是唯一的数据入口，不要直接手改 `page/boss.html` / `page/item.html` 后反过来覆盖数据源。

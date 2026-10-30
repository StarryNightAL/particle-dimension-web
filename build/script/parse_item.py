# parse_item.py
# 读取：build/data/item.txt 与 build/data/item.json
# 结构：json_obj["items"][type] = [物品, ...]
# 图片路径：../picture/item/{type_en}/{imgsrc}
# 输出：
#   local/user/tmp/item_render.html    （片段备份）
#   local/user/tmp/item_parsed.json    （解析后结构化数据）
#   page/new_item.html                 （完整可运行的页面，已加入 .gitignore）
# 运行：python build/script/parse_item.py

import json
import re
import html as html_lib
from pathlib import Path
from collections import defaultdict


# ---------- 路径配置 ----------
HERE = Path(__file__).resolve().parent
BUILD_DIR = HERE.parent
ROOT = BUILD_DIR.parent
DATA_DIR = BUILD_DIR / "data"
TMP_DIR = ROOT / "local" / "user" / "tmp"
PAGE_ITEM = ROOT / "page" / "new_item.html"

ITEM_TXT = DATA_DIR / "item.txt"
ITEM_JSON = DATA_DIR / "item.json"
OUT_HTML = TMP_DIR / "item_render.html"
OUT_JSON = TMP_DIR / "item_parsed.json"

# ---------- 图片路径模式 ----------
# "type"  → ../picture/item/{type_en}/{imgsrc}
# "flat"  → ../picture/item/{imgsrc}
PATH_MODE = "type"
PATH_BASE = "../picture/item"
DEFAULT_COLOR = "#FFFFFF"


# ---------- 工具 ----------
def esc(s) -> str:
    return html_lib.escape(str(s), quote=True)


def slug(s: str) -> str:
    return "cat-" + re.sub(r"\W+", "_", s, flags=re.UNICODE).strip("_")


# ---------- 1. 抽 meta 块 ----------
def parse_meta(txt: str) -> dict:
    blocks = {}
    for m in re.finditer(r"```meta:([^\n]+)\n([\s\S]*?)```", txt):
        blocks[m.group(1).strip()] = m.group(2)

    map_block = blocks.get("路径中英文映射表", "")
    regions, sub_regions, types = {}, {}, {}
    mode = None
    for line in map_block.splitlines():
        t = line.strip()
        if t == "region":
            mode = "region"; continue
        if t == "sub_region":
            mode = "sub"; continue
        if t == "type":
            mode = "type"; continue
        if not t or not mode or "=" not in t:
            continue
        zh, en = (s.strip() for s in t.split("=", 1))
        if zh and en:
            if mode == "region":
                regions[zh] = en
            elif mode == "sub":
                sub_regions[zh] = en
            else:
                types[zh] = en
    return {"regions": regions, "sub_regions": sub_regions, "types": types}


# ---------- 2. 空值判定 ----------
def is_empty(v) -> bool:
    if v is None:
        return True
    s = str(v).strip()
    if s == "":
        return True
    return s.lower() in ("default", "none", "null")


# ---------- 3. 解析单个物品 ----------
def resolve_item(raw: dict, maps: dict, errors: list, type_override: str = None):
    item = {k: v for k, v in raw.items() if not k.startswith("_")}

    name = item.get("name")
    if is_empty(name):
        errors.append(f"物品缺少 name（type={type_override}），已跳过")
        return None

    # type 必须有映射
    type_en = maps["types"].get(type_override)
    if not type_en:
        errors.append(f"未知 type: {type_override!r}（物品：{name}），不渲染")
        return None

    # region / sub_region 保留作为展示信息，不参与图片路径
    region_zh = item.get("region")
    region_en = None
    if not is_empty(region_zh):
        region_en = maps["regions"].get(region_zh)
        if not region_en:
            errors.append(f"未知 region: {region_zh!r}（物品：{name}），不渲染")
            return None

    sub_zh = None
    sub_en = None
    if not is_empty(item.get("sub_region")):
        sub_zh = item["sub_region"]
        sub_en = maps["sub_regions"].get(sub_zh)
        if not sub_en:
            errors.append(f"未知 sub_region: {sub_zh!r}（物品：{name}），不渲染")
            return None

    color = item.get("color")
    if is_empty(color):
        color = DEFAULT_COLOR
    elif not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(color)):
        errors.append(f"color 格式非法: {color!r}（物品：{name}），已用默认色")
        color = DEFAULT_COLOR

    raw_img = item.get("imgsrc")
    if is_empty(raw_img):
        imgsrc = f"{name}.png"
        is_full_path = False
    elif str(raw_img).startswith("../"):
        imgsrc = str(raw_img)
        is_full_path = True
    else:
        imgsrc = str(raw_img)
        is_full_path = False

    if is_full_path:
        src = imgsrc
    elif PATH_MODE == "flat":
        src = f"{PATH_BASE}/{imgsrc}"
    else:  # PATH_MODE == "type"
        src = f"{PATH_BASE}/{type_en}/{imgsrc}"

    return {
        "name": name,
        "color": color,
        "src": src,
        "region_zh": region_zh or "",
        "region_en": region_en or "",
        "sub_zh": sub_zh,
        "sub_en": sub_en,
        "type": type_override or "",
        "type_en": type_en,
        "desc": item.get("desc") or "",
        "source": item.get("source") or "",
        "usage": item.get("usage") or "",
    }


# ---------- 4. 渲染单张卡片 ----------
def render_card(it: dict) -> str:
    return f"""
                        <div class="item-card">
                            <img src="{esc(it['src'])}" alt="{esc(it['name'])}" loading="lazy">
                            <div class="item-info">
                                <div class="item-name" style="color:{esc(it['color'])}">{esc(it['name'])}</div>
                                <div class="item-meta">
                                    <p><strong>描述：</strong>{esc(it['desc'])}</p>
                                    <p><strong>主要获取方式：</strong>{esc(it['source'])}</p>
                                    <p><strong>主要用途：</strong>{esc(it['usage'])}</p>
                                </div>
                            </div>
                        </div>"""


# ---------- 5. 渲染正文（按 type 分组，顺序即 items 里各 type 出现的顺序） ----------
def render(items: list) -> str:
    type_order = []
    type_en_of = {}
    by_type = defaultdict(list)

    for it in items:
        t = it["type"] or "未分类"
        if t not in type_order:
            type_order.append(t)
            type_en_of[t] = it["type_en"] or slug(t)
        by_type[t].append(it)

    sections = []
    for t in type_order:
        sid = type_en_of[t]
        cards = "".join(render_card(it) for it in by_type[t])
        sections.append(f"""
            <section class="content-section">
                <article class="content-card">
                    <h2 class="content-title" id="{esc(sid)}">{esc(t)}</h2>
                    <div class="item-grid item-grid-3">{cards}
                    </div>
                </article>
            </section>""")

    return "\n".join(sections)


# ---------- 6. 渲染顶部子导航 ----------
def render_nav(items: list) -> str:
    seen = []
    for it in items:
        t = it["type"] or "未分类"
        if t not in [s[0] for s in seen]:
            seen.append((t, it["type_en"] or slug(t)))

    links = []
    for i, (zh, en) in enumerate(seen):
        if i > 0:
            links.append('                <span class="sub-nav-separator">|</span>')
        links.append(f'                <a href="#{esc(en)}" class="sub-nav-link">{esc(zh)}</a>')

    return f"""            <nav class="sub-nav">
{chr(10).join(links)}
            </nav>"""


# ---------- 7. 完整页面模板 ----------
PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>粒子维度 附属Wiki - 物品图鉴</title>
    <link rel="icon" href="../favicon.ico">
    <link rel="stylesheet" href="../font/fonts.css">
    <link rel="stylesheet" href="../style.css">
    <style>
        .item-card {
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(20, 20, 40, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 12px;
            padding: 14px;
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            transition: all 0.3s;
        }
        .item-card:hover {
            border-color: rgba(94, 234, 219, 0.3);
            box-shadow: 0 3px 22px rgba(0, 0, 0, 0.35), 0 0 32px rgba(94, 234, 219, 0.1);
            transform: translateY(-2px);
            background: rgba(24, 24, 48, 0.7);
        }
        .item-card img {
            width: 128px;
            height: 128px;
            object-fit: contain;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            padding: 6px;
            flex-shrink: 0;
        }
        .item-info { flex: 1; }
        .item-name {
            font-size: 1rem;
            font-weight: 700;
            color: #e0e0f0;
            margin-bottom: 4px;
        }
        .item-meta {
            font-size: 0.82rem;
            color: #b0b0c8;
            line-height: 1.6;
        }
        .item-meta p { margin-bottom: 2px; }
        .item-meta strong { color: #d0d0e0; }

        .sub-nav {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .sub-nav-link {
            color: var(--text-secondary);
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.3s;
        }
        .sub-nav-link:hover {
            color: #fff;
            background: rgba(94, 234, 219, 0.1);
        }
        .sub-nav-separator {
            color: rgba(180, 180, 200, 0.3);
        }
    </style>
</head>
<body>
    <canvas id="particle-canvas" aria-hidden="true"></canvas>
    <div class="app-container">
        <aside id="sidebar"></aside>
        <main class="main-content">
__CONTENT__
        </main>
    </div>
    <script src="../script.js"></script>
</body>
</html>
"""


def write_full_page(nav_html: str, body_html: str) -> bool:
    content = nav_html + "\n\n" + body_html
    page_txt = PAGE_TEMPLATE.replace("__CONTENT__", content)
    PAGE_ITEM.parent.mkdir(parents=True, exist_ok=True)
    PAGE_ITEM.write_text(page_txt, encoding="utf-8")
    return True


# ---------- 8. 入口 ----------
def build(meta_txt: str, json_obj: dict) -> dict:
    maps = parse_meta(meta_txt)
    errors = []
    items = []

    items_root = json_obj.get("items", {})
    if not isinstance(items_root, dict):
        errors.append("根 items 不是对象，无法解析")
        items_root = {}

    for type_zh, item_list in items_root.items():
        if type_zh.startswith("_"):
            continue
        if not isinstance(item_list, list):
            errors.append(f"{type_zh} 不是数组，已跳过")
            continue
        for raw in item_list:
            r = resolve_item(raw, maps, errors, type_override=type_zh)
            if r:
                items.append(r)

    if errors:
        print("[解析警告]")
        for e in errors:
            print("  -", e)

    return {
        "html": render(items),
        "nav": render_nav(items),
        "items": items,
        "errors": errors,
        "maps": maps,
    }


if __name__ == "__main__":
    if not ITEM_TXT.exists():
        raise FileNotFoundError(f"找不到 {ITEM_TXT}")
    if not ITEM_JSON.exists():
        raise FileNotFoundError(f"找不到 {ITEM_JSON}")

    TMP_DIR.mkdir(parents=True, exist_ok=True)

    meta_txt = ITEM_TXT.read_text(encoding="utf-8")
    json_obj = json.loads(ITEM_JSON.read_text(encoding="utf-8"))

    result = build(meta_txt, json_obj)

    OUT_HTML.write_text(result["nav"] + "\n\n" + result["html"], encoding="utf-8")
    OUT_JSON.write_text(
        json.dumps(result["items"], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_full_page(result["nav"], result["html"])

    print(f"渲染 {len(result['items'])} 个物品，错误 {len(result['errors'])} 条。")
    print(f"片段备份：{OUT_HTML}")
    print(f"数据备份：{OUT_JSON}")
    print(f"生成页面：{PAGE_ITEM}")
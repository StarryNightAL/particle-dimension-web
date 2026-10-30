# parse_boss.py
# 读取：build/data/boss.txt（规范与映射表）与 build/data/boss.json（BOSS 数据）
# 输出：
#   local/user/tmp/boss_parsed.json   校验并规范化后的分组数据
#   local/user/tmp/boss_render.html   正文片段备份
#   page/new_boss.html                完整可打开页面（已加入 .gitignore）
#
# 运行：python build/script/parse_boss.py
#
# 与 parse_item.py 的分工保持一致：
#   boss.txt  = 数据源规范、区域映射表、格式示例
#   boss.json = 实际 BOSS 数据，根对象为 {"bosses": {region: [boss, ...]}}
#
# 不直接改写线上 page/boss.html；生成结果写到 page/new_boss.html 供比对。
# 资源路径保持 ../，CSS/JS 由维护者按最终放置位置手动同步。

from __future__ import annotations

import argparse
import html as html_lib
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

# ---------- 路径配置 ----------
HERE = Path(__file__).resolve().parent
BUILD_DIR = HERE.parent
ROOT = BUILD_DIR.parent
DATA_DIR = BUILD_DIR / "data"
TMP_DIR = ROOT / "local" / "user" / "tmp"

BOSS_TXT = DATA_DIR / "boss.txt"
BOSS_JSON = DATA_DIR / "boss.json"
OUT_JSON = TMP_DIR / "boss_parsed.json"
OUT_HTML = TMP_DIR / "boss_render.html"
PAGE_BOSS = ROOT / "page" / "new_boss.html"

# ---------- 规则 ----------
DEFAULT_COLOR = "#FF5555"
DEFAULT_CREDIT_USER = "玩家狐望江"

SUMMARY_KEYS = ("坐标", "召唤消耗", "开启箱子消耗", "箱子爆率")

SECTION_KEYS = (
    "Boss名",
    "别名",
    "召唤物",
    "简略介绍",
    "战利品",
    "进入场地限制",
    "经验",
    "特点",
    "主动技能",
    "被动技能",
    "场地效果",
    "额外备注",
    "其它效果",
)

LIST_KEYS = {"主动技能", "被动技能", "场地效果", "其它效果"}

COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
SUBTITLE_RE = re.compile(r"^(.*?)（([^）]*)）$")
SUBTITLE_WRAP_RE = re.compile(r"^（(.*)）$", re.S)


# ---------- 工具 ----------
def is_empty(value) -> bool:
    if value is None:
        return True
    text = str(value).strip()
    if text == "":
        return True
    return text.lower() in ("default", "none", "null")


def parse_bool(value, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    text = str(value).strip().lower()
    if text in ("true", "1", "yes"):
        return True
    if text in ("false", "0", "no"):
        return False
    return default


def make_id(prefix: str, text: str) -> str:
    slug = re.sub(r"[^\w\u4e00-\u9fff]+", "_", str(text), flags=re.UNICODE).strip("_")
    return f"{prefix}-{slug}"


def parse_meta(txt: str) -> dict:
    """读取 boss.txt 中的 ```meta:...``` 块。"""
    blocks = {
        match.group(1).strip(): match.group(2)
        for match in re.finditer(r"```meta:([^\n]+)\n([\s\S]*?)```", txt)
    }

    map_block = (
        blocks.get("区域中英文映射表")
        or blocks.get("路径中英文映射表")
        or ""
    )
    regions: dict[str, str] = {}
    sub_regions: dict[str, str] = {}
    mode = None

    for line in map_block.splitlines():
        text = line.strip()
        if text == "region":
            mode = "region"
            continue
        if text == "sub_region":
            mode = "sub"
            continue
        if not text or not mode or "=" not in text:
            continue
        zh, en = (part.strip() for part in text.split("=", 1))
        if not zh or not en:
            continue
        if mode == "region":
            regions[zh] = en
        else:
            sub_regions[zh] = en

    return {"regions": regions, "sub_regions": sub_regions}


# ---------- 字段规范化 ----------
def normalize_items(value, boss_name: str, key: str, errors: list, warnings: list) -> list:
    if not isinstance(value, list):
        errors.append(f"{boss_name}：sections.{key} 必须是数组")
        return []

    result = []
    for index, raw in enumerate(value, start=1):
        if isinstance(raw, str):
            item_name = raw.strip()
            description = ""
            children = None
        elif isinstance(raw, dict):
            item_name = str(raw.get("name", "")).strip()
            description = str(raw.get("description", "") or "").strip()
            children = raw.get("children")
        else:
            errors.append(f"{boss_name}：sections.{key}[{index}] 不是字符串或对象")
            continue

        if not item_name:
            errors.append(f"{boss_name}：sections.{key}[{index}] 缺少 name")
            continue

        item = {"name": item_name}
        if description:
            item["description"] = description

        if children is not None:
            if not isinstance(children, list):
                errors.append(f"{boss_name}：sections.{key}[{index}].children 必须是数组")
            else:
                normalized_children = []
                for child_index, child in enumerate(children, start=1):
                    if isinstance(child, str):
                        normalized_children.append({"name": child.strip()})
                    elif isinstance(child, dict):
                        child_name = str(child.get("name", "")).strip()
                        child_desc = str(child.get("description", "") or "").strip()
                        if not child_name:
                            errors.append(
                                f"{boss_name}：sections.{key}[{index}].children[{child_index}] 缺少 name"
                            )
                            continue
                        normalized_child = {"name": child_name}
                        if child_desc:
                            normalized_child["description"] = child_desc
                        normalized_children.append(normalized_child)
                    else:
                        errors.append(
                            f"{boss_name}：sections.{key}[{index}].children[{child_index}] 类型非法"
                        )
                if normalized_children:
                    item["children"] = normalized_children

        result.append(item)

    return result


def normalize_summary(value, boss_name: str, errors: list) -> list:
    if not isinstance(value, list):
        errors.append(f"{boss_name}：summary 必须是数组")
        return []

    result = []
    for index, entry in enumerate(value, start=1):
        if not isinstance(entry, dict):
            errors.append(f"{boss_name}：summary[{index}] 必须是对象")
            continue
        key = str(entry.get("key", "")).strip()
        text = str(entry.get("value", "") or "").strip()
        if not key:
            errors.append(f"{boss_name}：summary[{index}] 缺少 key")
            continue
        result.append({"key": key, "value": text})
    return result


def normalize_sections(value, boss_name: str, errors: list, warnings: list) -> dict:
    if not isinstance(value, dict):
        errors.append(f"{boss_name}：sections 必须是对象")
        return {}

    result = {}
    for key, raw in value.items():
        if key.startswith("_"):
            continue

        if key == "Boss名":
            if str(raw).strip() != boss_name:
                warnings.append(
                    f"{boss_name}：sections.Boss名 与 name 不一致，已忽略 Boss名"
                )
            continue

        if key not in SECTION_KEYS:
            warnings.append(f"{boss_name}：未知 sections 字段 {key!r}，已保留原值")
            result[key] = raw
            continue

        if key in LIST_KEYS:
            result[key] = normalize_items(raw, boss_name, key, errors, warnings)
        else:
            if isinstance(raw, (dict, list)):
                errors.append(f"{boss_name}：sections.{key} 必须是字符串")
                continue
            result[key] = str(raw).strip()

    return result


def split_name_subtitle(name: str) -> tuple[str, str]:
    """按标题末尾的全角括号拆分 name / subtitle。"""
    match = SUBTITLE_RE.match(name)
    if not match:
        return name, ""
    return match.group(1).strip(), match.group(2).strip()


def normalize_subtitle(value, fallback: str = "") -> str:
    """解析 subtitle：允许带括号或不带括号，最终统一存不带括号的文本。"""
    if value is None or not str(value).strip():
        return fallback
    text = str(value).strip()
    match = SUBTITLE_WRAP_RE.match(text)
    if match:
        text = match.group(1).strip()
    return text


def normalize_boss(raw: dict, region_key: str, maps: dict, errors: list, warnings: list) -> dict | None:
    boss = {key: value for key, value in raw.items() if not key.startswith("_")}

    raw_name = str(boss.get("name", "")).strip()
    name, name_subtitle = split_name_subtitle(raw_name)
    if not name:
        errors.append(f"区域 {region_key} 中有 BOSS 缺少 name，已跳过")
        return None

    explicit_subtitle = boss.get("subtitle")
    subtitle = normalize_subtitle(explicit_subtitle, fallback=name_subtitle)
    if explicit_subtitle and name_subtitle and subtitle != name_subtitle:
        warnings.append(
            f"{name}：name 中的副标题与 subtitle 不一致，已使用 subtitle"
        )

    region = str(boss.get("region", "")).strip() or region_key
    if region != region_key:
        errors.append(
            f"{name}：region={region!r} 与所在 bosses 的 key {region_key!r} 不一致，已跳过"
        )
        return None

    sub_raw = boss.get("sub_region")
    sub_region = None if is_empty(sub_raw) else str(sub_raw).strip()

    raw_color = boss.get("color")
    if is_empty(raw_color):
        color = DEFAULT_COLOR
    else:
        color = str(raw_color).strip()
        if not COLOR_RE.match(color):
            errors.append(f"{name}：color={color!r} 非法，已使用默认色 {DEFAULT_COLOR}")
            color = DEFAULT_COLOR

    credit = parse_bool(boss.get("credit"), True)
    credit_user = str(boss.get("credit_user", "") or "").strip() or DEFAULT_CREDIT_USER
    credit_add_change = parse_bool(boss.get("credit_add_change"), False)
    if credit:
        credit_text = f"此卡片除蓝框部分外由{credit_user}提供"
        if credit_add_change:
            credit_text += "，由星夜StarN修改"
        credit_info = {
            "enabled": True,
            "user": credit_user,
            "add_change": credit_add_change,
            "text": credit_text,
        }
    else:
        credit_info = {
            "enabled": False,
            "add_change": False,
            "text": "",
        }

    summary = normalize_summary(boss.get("summary"), name, errors)
    sections = normalize_sections(boss.get("sections"), name, errors, warnings)
    if not sections:
        errors.append(f"{name}：sections 为空")

    region_id = maps["regions"].get(region)
    if not region_id:
        warnings.append(f"{name}：区域 {region!r} 缺少中英文映射，已生成临时 id")
        region_id = make_id("region", region)

    sub_region_id = None
    if sub_region:
        sub_region_id = maps["sub_regions"].get(sub_region)
        if not sub_region_id:
            warnings.append(f"{name}：子区域 {sub_region!r} 缺少中英文映射，已生成临时 id")
            sub_region_id = make_id("sub", sub_region)

    result = {
        "name": name,
        "color": color,
        "credit": credit_info,
        "region": region,
        "region_id": region_id,
        "sub_region": sub_region,
        "sub_region_id": sub_region_id,
        "summary": summary,
        "sections": sections,
    }
    if subtitle:
        result["subtitle"] = subtitle
    return result


# ---------- 主流程 ----------
def build(root: dict, maps: dict) -> tuple[dict, list, list]:
    errors: list[str] = []
    warnings: list[str] = []

    bosses_root = root.get("bosses")
    if not isinstance(bosses_root, dict) or not bosses_root:
        raise ValueError("boss.json 根对象缺少非空的 \"bosses\" 对象")

    regions = []
    seen_names = set()

    for region_name, raw_bosses in bosses_root.items():
        if not isinstance(raw_bosses, list):
            errors.append(f"区域 {region_name} 的值必须是数组")
            continue

        region_id = maps["regions"].get(region_name)
        if not region_id:
            warnings.append(f"区域 {region_name!r} 缺少中英文映射，已生成临时 id")
            region_id = make_id("region", region_name)

        region = {
            "name": region_name,
            "id": region_id,
            "bosses": [],
            "sub_regions": [],
        }
        sub_map: OrderedDict[str, dict] = OrderedDict()

        for raw in raw_bosses:
            if not isinstance(raw, dict):
                errors.append(f"区域 {region_name} 中存在非对象 BOSS，已跳过")
                continue

            boss = normalize_boss(raw, region_name, maps, errors, warnings)
            if boss is None:
                continue

            if boss["name"] in seen_names:
                errors.append(f"BOSS 名称重复：{boss['name']}")
                continue
            seen_names.add(boss["name"])

            if boss["sub_region"] is None:
                region["bosses"].append(boss)
            else:
                sub_name = boss["sub_region"]
                sub = sub_map.setdefault(sub_name, {
                    "name": sub_name,
                    "id": boss["sub_region_id"],
                    "bosses": [],
                })
                sub["bosses"].append(boss)

        region["sub_regions"] = list(sub_map.values())
        regions.append(region)

    data = {
        "format_version": 1,
        "source": "boss.json",
        "regions": regions,
    }
    return data, errors, warnings


# ---------- 渲染 ----------
def esc(value) -> str:
    return html_lib.escape(str(value), quote=True)


def render_value(value, key: str = "") -> str:
    text = esc(value)
    # 爆率特殊处理：每个空格逐个转成可见的 &nbsp;
    if "爆率" in key:
        text = text.replace(" ", "&nbsp;")
    # 已知键有多行时，冒号后先换行再输出首行
    if "\n" in str(value):
        text = "<br>" + text
    return text.replace("\n", "<br>")


def render_children(children: list) -> str:
    lines = []
    for child in children:
        name = esc(child.get("name", ""))
        description = esc(child.get("description", ""))
        text = f"{name}：{description}" if description else name
        lines.append(f'                                        <li>{text}</li>')
    return "\n".join(lines)


def render_list_items(items: list) -> str:
    lines = []
    for item in items:
        name = esc(item.get("name", ""))
        description = esc(item.get("description", ""))
        text = f"{name}：{description}" if description else name

        children = item.get("children") or []
        if children:
            text = (
                f"{text}\n"
                f'                                        <ul class="skill-sub-list">\n'
                f"{render_children(children)}\n"
                f"                                        </ul>"
            )

        lines.append(f"                                    <li>{text}</li>")
    return "\n".join(lines)


def render_sections(sections: dict) -> str:
    parts = []
    for key, value in sections.items():
        if isinstance(value, list):
            parts.append(
                f'                            <p class="content-text"><strong>{esc(key)}：</strong></p>\n'
                f'                            <ul class="skill-list">\n'
                f"{render_list_items(value)}\n"
                f"                            </ul>"
            )
        else:
            parts.append(
                f'                            <p class="content-text"><strong>{esc(key)}：</strong>{render_value(value, key)}</p>'
            )
    return "\n".join(parts)


def render_boss(boss: dict) -> str:
    name_html = esc(boss["name"])
    subtitle = boss.get("subtitle", "")
    if subtitle:
        name_html += f'<span style="color: gray;">（{esc(subtitle)}）</span>'

    summary_html = "\n".join(
        f'                                <p><strong>{esc(entry["key"])}：</strong>{render_value(entry["value"], entry["key"])}</p>'
        for entry in boss["summary"]
    )
    sections_html = render_sections(boss["sections"])

    credit = boss["credit"]
    credit_html = ""
    if credit["enabled"]:
        credit_html = f'\n                        <p class="credit-text">{esc(credit["text"])}</p>'

    return f'''                    <div class="boss-sub-card">
                        <h3 class="boss-name" style="color: {boss["color"]};">{name_html}</h3>
                        <div class="boss-detail">
                            <div class="boss-summary">
{summary_html}
                            </div>
                            <p class="content-text"><strong>Boss名：</strong>{esc(boss["name"])}</p>
{sections_html}
                        </div>{credit_html}
                    </div>'''


def render_regions(regions: list) -> str:
    parts = []
    for region in regions:
        inner = []
        for boss in region["bosses"]:
            inner.append(render_boss(boss))
        for sub in region["sub_regions"]:
            inner.append(
                f'                    <h3 class="sub-region-title" id="{esc(sub["id"])}">{esc(sub["name"])}</h3>'
            )
            for boss in sub["bosses"]:
                inner.append(render_boss(boss))

        parts.append(f'''            <section class="content-section">
                <article class="content-card">
                    <h2 class="content-title" id="{esc(region["id"])}">{esc(region["name"])}</h2>
{chr(10).join(inner)}
                </article>
            </section>''')

    return "\n\n".join(parts)


PREFACE_HTML = '''            <section class="content-section">
                <article class="content-card">
                    <h2 class="content-title">前言</h2>
                    <p class="content-text">
                        本书为怪物图鉴的重制版，制作相对前版比较精良，完善前版的各个缺点，比如说重点内容加了点彩色，本次重制版，主要把技巧选项删除，减少主观性，保证内容真实有效。<br>
                        编：狐望江，暗己调灵之{鬼魂}<br>
                        鸣谢（部分资料提供，不分前后）：孤僻的羊吃麦片，sleep___，Rav_若兮初日，海灵伯，YF年华
                    </p>
                    <p class="credit-text">此部分由玩家狐望江提供；摘自原文本</p>
                </article>
            </section>'''


def render_content(regions: list) -> str:
    return PREFACE_HTML + "\n\n" + render_regions(regions)


# ---------- 页面模板 ----------
PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>粒子维度 附属Wiki - BOSS详情</title>
    <link rel="icon" href="../favicon.ico">
    <link rel="stylesheet" href="../font/fonts.css">
    <link rel="stylesheet" href="../style.css">
    <style>
        ul.skill-list {
            list-style: none;
            padding-left: 0;
        }
        .skill-list li {
            position: relative;
            padding-left: 1.05em;
            font-size: 0.95rem;
            color: #e0e0e8;
            margin-bottom: 6px;
        }
        .skill-list li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0.56em;
            width: 0.38em;
            height: 0.38em;
            border-radius: 50%;
            background: currentColor;
        }
        .skill-list .skill-sub-list {
            list-style: none;
            padding-left: 0.7em;
            margin-top: 3px;
        }
        .skill-list .skill-sub-list > li {
            padding-left: 0;
        }
        .skill-list .skill-sub-list > li::before {
            content: none;
        }
        .credit-text {
            font-size: 0.75rem;
            color: rgba(180, 180, 200, 0.6);
            text-align: right;
            margin-top: 12px;
            font-style: italic;
        }
        .boss-summary {
            background: rgba(255, 255, 255, 0.03);
            padding: 10px 14px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 2px solid var(--accent-cyan);
        }
        .boss-summary p {
            margin-bottom: 4px;
            font-size: 0.9rem;
            color: #c0c0d8;
        }
        .boss-summary strong {
            color: #d0d0e0;
        }
        .boss-sub-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 14px 16px 10px;
            margin-bottom: 14px;
        }
        .boss-sub-card:last-child {
            margin-bottom: 0;
        }
        .boss-name {
            font-family: var(--font-main);
            font-weight: 700;
            font-size: 1rem;
            letter-spacing: 0.04em;
            color: #e0e0f0;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
    </style>
</head>
<body>
    <canvas id="particle-canvas" aria-hidden="true"></canvas>

    <div class="app-container">
        <aside id="sidebar"></aside>

        <main class="main-content boss-page">
__CONTENT__
        </main>
    </div>

    <script src="../script.js"></script>
</body>
</html>
"""


def write_full_page(content: str, page_path: Path) -> None:
    page_path.parent.mkdir(parents=True, exist_ok=True)
    page_path.write_text(PAGE_TEMPLATE.replace("__CONTENT__", content), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="校验 boss.json 并生成规范化数据与新 BOSS 页面")
    parser.add_argument("--txt", type=Path, default=BOSS_TXT, help="boss.txt 路径")
    parser.add_argument("--json", type=Path, default=BOSS_JSON, help="boss.json 路径")
    parser.add_argument("--out", type=Path, default=OUT_JSON, help="规范化 JSON 输出路径")
    parser.add_argument("--page", type=Path, default=PAGE_BOSS, help="完整 HTML 输出路径")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not args.txt.exists():
        print(f"找不到规范文件：{args.txt}", file=sys.stderr)
        return 1
    if not args.json.exists():
        print(f"找不到数据文件：{args.json}", file=sys.stderr)
        return 1

    try:
        maps = parse_meta(args.txt.read_text(encoding="utf-8"))
        root = json.loads(args.json.read_text(encoding="utf-8"))
        data, errors, warnings = build(root, maps)
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"解析失败：{exc}", file=sys.stderr)
        return 1

    if errors:
        print(f"[错误 {len(errors)} 条]", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    content = render_content(data["regions"])
    OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_text(content + "\n", encoding="utf-8")
    write_full_page(content, args.page)

    boss_count = sum(
        len(region["bosses"]) + sum(len(sub["bosses"]) for sub in region["sub_regions"])
        for region in data["regions"]
    )
    print(f"已渲染 {len(data['regions'])} 个区域、{boss_count} 个 BOSS")
    print(f"规范化数据：{args.out}")
    print(f"正文片段：{OUT_HTML}")
    print(f"生成页面：{args.page}")

    if warnings:
        print(f"\n[警告 {len(warnings)} 条]")
        for warning in warnings:
            print(f"  - {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

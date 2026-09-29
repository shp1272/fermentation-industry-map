#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
发酵产业公开信息地图 · 企业卡数据校验脚本

用法：
    python3 tools/validate_data.py

检查内容：
  1. JSON 可正常解析，顶层为数组
  2. 必填字段齐全且非空
  3. id 不重复
  4. 枚举字段取值合法（price_status / confidence / status）
  5. 日期格式为 YYYY-MM-DD
  6. 网址以 http:// 或 https:// 开头

退出码：0 表示全部通过；1 表示存在错误。
警告（warning）不导致退出码非 0，但建议处理。
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "companies.json"

REQUIRED_FIELDS = [
    "id",
    "name",
    "city",
    "service_tags",
    "public_capability",
    "price_status",
    "source_url",
    "checked_at",
    "confidence",
    "status",
]

OPTIONAL_FIELDS = ["contact_url"]

PRICE_STATUS_VALUES = {"public", "price", "quote required", "not found"}
CONFIDENCE_VALUES = {"high", "medium", "low"}
STATUS_VALUES = {"sample", "pending", "verified"}

KNOWN_TAGS = {"中试", "代工", "检测", "菌种", "发酵"}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def main():
    if not DATA_FILE.exists():
        print(f"[错误] 找不到数据文件：{DATA_FILE}")
        return 1

    try:
        raw = DATA_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"[错误] JSON 解析失败：{exc}")
        return 1
    except OSError as exc:
        print(f"[错误] 读取文件失败：{exc}")
        return 1

    errors = []
    warnings = []

    if not isinstance(data, list):
        print("[错误] 顶层结构必须是数组（list）。")
        return 1

    print(f"共 {len(data)} 条企业卡数据\n")

    seen_ids = {}
    for idx, card in enumerate(data, start=1):
        label = f"第 {idx} 条（id={card.get('id', '缺失')!r}）"

        if not isinstance(card, dict):
            errors.append(f"{label}：不是对象（dict）。")
            continue

        # 1. 必填字段
        for field in REQUIRED_FIELDS:
            value = card.get(field)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors.append(f"{label}：必填字段 {field!r} 缺失或为空。")

        # 2. 未知字段
        allowed = set(REQUIRED_FIELDS) | set(OPTIONAL_FIELDS)
        unknown = set(card.keys()) - allowed
        if unknown:
            warnings.append(f"{label}：存在未定义字段 {sorted(unknown)}，请确认拼写或更新数据说明。")

        # 3. id 唯一
        card_id = card.get("id")
        if isinstance(card_id, str) and card_id.strip():
            if card_id in seen_ids:
                errors.append(f"{label}：id {card_id!r} 与第 {seen_ids[card_id]} 条重复。")
            else:
                seen_ids[card_id] = idx

        # 4. service_tags 为非空字符串数组
        tags = card.get("service_tags")
        if tags is not None:
            if not isinstance(tags, list) or not tags:
                errors.append(f"{label}：service_tags 必须是非空数组。")
            else:
                for tag in tags:
                    if not isinstance(tag, str) or not tag.strip():
                        errors.append(f"{label}：service_tags 中存在空标签。")
                    elif tag not in KNOWN_TAGS:
                        warnings.append(f"{label}：标签 {tag!r} 不在常用集合 {sorted(KNOWN_TAGS)} 中，如为新标签请同步更新数据说明。")

        # 5. 枚举字段
        price = card.get("price_status")
        if price is not None and price not in PRICE_STATUS_VALUES:
            errors.append(f"{label}：price_status 取值 {price!r} 非法，应为 {sorted(PRICE_STATUS_VALUES)} 之一。")

        conf = card.get("confidence")
        if conf is not None and conf not in CONFIDENCE_VALUES:
            errors.append(f"{label}：confidence 取值 {conf!r} 非法，应为 {sorted(CONFIDENCE_VALUES)} 之一。")

        status = card.get("status")
        if status is not None and status not in STATUS_VALUES:
            errors.append(f"{label}：status 取值 {status!r} 非法，应为 {sorted(STATUS_VALUES)} 之一。")

        # 6. 日期格式
        checked = card.get("checked_at")
        if isinstance(checked, str) and checked.strip():
            if not DATE_RE.match(checked):
                errors.append(f"{label}：checked_at {checked!r} 格式应为 YYYY-MM-DD。")
            else:
                try:
                    datetime.strptime(checked, "%Y-%m-%d")
                except ValueError:
                    errors.append(f"{label}：checked_at {checked!r} 不是有效日期。")

        # 7. 网址格式
        for field in ("source_url", "contact_url"):
            url = card.get(field)
            if url and isinstance(url, str) and url.strip():
                if not URL_RE.match(url.strip()):
                    errors.append(f"{label}：{field} {url!r} 必须以 http:// 或 https:// 开头。")

    # 汇总
    if warnings:
        print("警告：")
        for w in warnings:
            print(f"  - {w}")
        print()

    if errors:
        print(f"发现 {len(errors)} 个错误：")
        for e in errors:
            print(f"  ✗ {e}")
        print("\n校验未通过。")
        return 1

    print("全部通过：必填字段齐全，id 无重复，枚举与日期格式合法。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

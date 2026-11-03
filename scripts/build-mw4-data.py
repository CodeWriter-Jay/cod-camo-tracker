"""由 codmunity 数据快照生成 src/data/mw4.json，并把挑战描述按词组规则翻译为中文。

用法：python3 -I scripts/build-mw4-data.py
遇到无法识别的挑战描述会直接报错，需在下方词表中补充后重新生成。
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data-source" / "codmunity-mw4.json"
OUTPUT = ROOT / "src" / "data" / "mw4.json"

CATEGORIES = [
    ("Assault Rifle", "突击步枪"),
    ("SMG", "冲锋枪"),
    ("Shotgun", "霰弹枪"),
    ("LMG", "轻机枪"),
    ("Marksman Rifle", "射手步枪"),
    ("Sniper", "狙击步枪"),
    ("Pistol", "手枪"),
    ("Launcher", "发射器"),
    ("Melee", "近战武器"),
]

GROUPS = {"Military Camos": "military", "Special Camos": "special", "Completionist": "completionist"}

# 精通迷彩为账号级挑战，codmunity 接口中单独配置，这里直接收录
MASTERY = {
    "mp": [
        ("Mercurial Drift", "Get 10 Kills in a match 250 times", "CODMunity_HD_MercurialDrift_lowwm.webp"),
        ("Polyatomic Reforged", "Get 3 Kills without Taking Damage 300 times", "CODMunity_HD_PolyatomicReforged_lowwm.webp"),
        ("Orion Reforged", "Get 5 Kills without dying 500 times", "CODMunity_HD_OrionReforged_lowwm.webp"),
    ],
    "dmz": [
        ("Chiral", "Get 2500 Tier 3+ enemy kills", "CODMunity_HD_Chiral_lowwm.webp"),
        ("Ripple Tide", "Exfil 2 LT dog tags in a single deployment 50 times", "CODMunity_HD_RippleTide_lowwm.webp"),
        ("Helio", "Get 25000 Kills using Legendary Weapons on a Max Level Operator", "CODMunity_HD_Helio_lowwm.webp"),
    ],
}
DIVERGENCE = ("Divergence", "CODMunity_HD_Divergence_lowwm.webp")
DIVERGENCE_REQUIRED = 33

# 句式不规则、无法用词组规则覆盖的描述
SPECIAL_TRANSLATIONS = {
    "Get 2500 Tier 3+ enemy kills": "击杀 2500 名 3 级及以上敌人",
    "Exfil 2 LT dog tags in a single deployment 50 times": "单次部署中带 2 个中尉狗牌撤离，达成 50 次",
    "Get 25000 Kills using Legendary Weapons on a Max Level Operator": "使用满级干员和传说武器击杀 25000 次",
}

# (匹配正则, 中文前缀)；按顺序拼接为“条件 + 击杀方式”
CONDITIONS = [
    (r"in a single match in dmz", "DMZ 单局内"),
    (r"in a single match", "单场内"),
    (r"in a match", "单场内"),
    (r"without dying", "不阵亡"),
    (r"without taking damage", "不受伤"),
    (r"without reloading", "不换弹"),
    (r"without releasing the trigger", "不松开扳机"),
    (r"(?:within|in) 5 seconds", "5 秒内"),
    (r"from behind", "从背后"),
    (r"while prone", "卧倒时"),
    (r"while crouched", "蹲下时"),
    (r"while jumping", "跳跃时"),
    (r"while moving", "移动时"),
    (r"while focused", "专注状态下"),
    (r"while (?:aiming down sights?|ads)", "开镜时"),
    (r"(?:while )?using a silencer", "装配消音器"),
    (r"while using akimbo", "双持时"),
    (r"while ledge hanging", "悬挂边缘时"),
    (r"using the heavy melee finisher", "用重击终结技"),
    (r"with miri 40mm grenade launcher", "用 Miri 40MM 榴弹发射器"),
    (r"while mounted", "架枪"),
]
KILL_KINDS = [
    (r"headshot kills|headshots", "爆头"),
    (r"hipfire kills", "腰射"),
    (r"longshot kills", "远距离"),
    (r"mounted kills", "架枪"),
    (r"point blank kills", "近身"),
    (r"quickscope kills", "快速开镜"),
    (r"one shot kills", "一枪"),
    (r"direct shot kills", "直接命中"),
    (r"kills", ""),
]


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def translate(text: str) -> str:
    if text in SPECIAL_TRANSLATIONS:
        return SPECIAL_TRANSLATIONS[text]
    if match := re.fullmatch(r"Reach Weapon Level (\d+)", text):
        return f"武器等级达到 {match[1]} 级"
    if match := re.fullmatch(r"Destroy (\d+) Killstreaks or Vehicles", text):
        return f"摧毁 {match[1]} 个连杀奖励或载具"

    rest = text.lower()
    times = None
    if match := re.search(r" (\d+) times", rest):
        times = match[1]
        rest = rest.replace(match[0], "")

    target = ""
    if re.search(r"against players|\bplayers?\b", rest):
        target = "玩家"
    elif re.search(r"against enemies|\benem(?:y|ies)\b", rest):
        target = "敌人"
    rest = re.sub(r"\s*\b(?:against players|against enemies|players?|enem(?:y|ies))\b", "", rest)

    match = re.fullmatch(r"get (\d+) (.+)", rest.strip())
    if not match:
        raise ValueError(f"无法识别的挑战描述：{text}")
    count, rest = match[1], f" {match[2]} "

    if rest.strip() == "double kills":
        body = f"对{target}达成 {count} 次双杀" if target else f"达成 {count} 次双杀"
        return f"{body}，达成 {times} 次" if times else body

    prefix = ""
    for pattern, label in CONDITIONS:
        if re.search(rf" {pattern} ", rest):
            prefix += label
            rest = re.sub(rf" {pattern} ", " ", rest, count=1)
    for pattern, label in KILL_KINDS:
        if re.fullmatch(rf"\s*(?:{pattern})\s*", rest):
            prefix += label
            break
    else:
        raise ValueError(f"挑战描述中有未翻译的部分「{rest.strip()}」：{text}")

    if target:
        body = f"{prefix}击杀 {count} 名{target}"
    else:
        # 未区分目标时，按“单次连续击杀若干人”或“累计击杀次数”两种语义表达
        body = f"{prefix}击杀 {count} 人" if times else f"{prefix}击杀 {count} 次"
    return f"{body}，达成 {times} 次" if times else body


def parse_target(text: str) -> int:
    """挑战需完成的次数：带 “N times” 的取 N，单场类挑战为 1，其余取首个数字。"""
    if text.startswith("Reach Weapon Level") or "single match" in text:
        return 1
    if match := re.search(r"(\d+) times", text):
        return int(match[1])
    if match := re.search(r"\d+", text):
        return int(match[0])
    raise ValueError(f"挑战描述中没有数字：{text}")


def challenge(text: str) -> dict:
    return {"en": text, "zh": translate(text), "target": parse_target(text)}


def build() -> dict:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    category_ids = {en: slugify(en) for en, _ in CATEGORIES}

    rows_by_weapon: dict[str, list] = {}
    for row in source["ch"]:
        rows_by_weapon.setdefault(row[0], []).append(row)

    weapons = []
    for slug_, name, category, icon, _unlock in source["weapons"]:
        rows = sorted(rows_by_weapon.get(name, []), key=lambda row: row[4])
        camos = {"mp": [], "dmz": []}
        for _weapon, camo_name, group, _level, _order, mp_text, dmz_text, _wz, image, _grind in rows:
            for mode, text in (("mp", mp_text), ("dmz", dmz_text or mp_text)):
                camos[mode].append(
                    {
                        "id": slugify(camo_name),
                        "name": camo_name,
                        "group": GROUPS[group],
                        "image": image,
                        "challenge": challenge(text),
                    }
                )
        weapons.append(
            {
                "id": slugify(name),
                "name": name,
                "category": category_ids[category],
                "image": icon or None,
                "camos": camos,
            }
        )

    mastery = {
        mode: [
            {"id": slugify(name), "name": name, "image": image, "challenge": challenge(text)}
            for name, text, image in items
        ]
        for mode, items in MASTERY.items()
    }

    return {
        "game": "mw4",
        "source": "https://codmunity.gg/zh/camo-tracker/mw4",
        "imageBaseUrl": "https://assets.codmunity.gg/optimized/",
        "categories": [{"id": category_ids[en], "name": zh} for en, zh in CATEGORIES],
        "modes": [{"id": "mp", "name": "多人游戏"}, {"id": "dmz", "name": "DMZ"}],
        "divergence": {
            "id": slugify(DIVERGENCE[0]),
            "name": DIVERGENCE[0],
            "image": DIVERGENCE[1],
            "requiredCamoId": "harmonic-break",
            "required": DIVERGENCE_REQUIRED,
        },
        "mastery": mastery,
        "weapons": weapons,
    }


if __name__ == "__main__":
    data = build()
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    camo_count = sum(len(w["camos"]["mp"]) for w in data["weapons"])
    print(f"{len(data['weapons'])} weapons, {camo_count} camos -> {OUTPUT.relative_to(ROOT)}", file=sys.stderr)

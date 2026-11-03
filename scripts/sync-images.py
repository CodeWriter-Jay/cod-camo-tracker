"""把浏览器导出的图片包解包到 public/images/，随客户端一起打包以支持离线使用。

codmunity 的图片 CDN 拒绝脚本直接下载，需在浏览器中导出：
  1. python3 -I scripts/sync-images.py --list  打印需要的图片清单（JSON）
  2. 在浏览器打开任一 https://assets.codmunity.gg/optimized/ 图片页，在控制台运行
     src/lib/exportScript.ts 生成的脚本（客户端设置页「复制导出脚本」可直接复制），
     导出 codmunity-mw4-images.json
  3. python3 -I scripts/sync-images.py data-source/codmunity-mw4-images.json

数据引用的图片若有缺失会以非零状态退出。
"""

import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "mw4.json"
OUTPUT_DIR = ROOT / "public" / "images"

# 与界面显示尺寸的 2 倍对齐，兼顾高分屏清晰度与包体积
CAMO_SIZE = "200x80"
WEAPON_SIZE = "144x72"


def collect_images(data: dict) -> dict[str, str]:
    images: dict[str, str] = {data["divergence"]["image"]: CAMO_SIZE}
    for camos in data["mastery"].values():
        images.update({camo["image"]: CAMO_SIZE for camo in camos if camo["image"]})
    for weapon in data["weapons"]:
        if weapon["image"]:
            images[weapon["image"]] = WEAPON_SIZE
        for camos in weapon["camos"].values():
            images.update({camo["image"]: CAMO_SIZE for camo in camos if camo["image"]})
    return images


def is_webp(content: bytes) -> bool:
    return content[:4] == b"RIFF" and content[8:12] == b"WEBP"


def main(args: list[str]) -> int:
    images = collect_images(json.loads(DATA.read_text(encoding="utf-8")))
    if args == ["--list"]:
        print(json.dumps(sorted(images.items()), separators=(",", ":")))
        return 0
    if len(args) != 1:
        print(__doc__, file=sys.stderr)
        return 2

    bundle = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for file, encoded in bundle.items():
        content = base64.b64decode(encoded)
        if not is_webp(content):
            print(f"跳过非 WebP 文件：{file}", file=sys.stderr)
            continue
        (OUTPUT_DIR / file).write_bytes(content)

    missing = sorted(file for file in images if not (OUTPUT_DIR / file).exists())
    print(f"{len(images)} images referenced, {len(missing)} missing", file=sys.stderr)
    for file in missing:
        print(f"  {file}", file=sys.stderr)
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

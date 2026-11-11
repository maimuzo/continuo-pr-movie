"""オレンジの丸いロボットの抜き済みの絵を、Claude Code の色（テラコッタ #D97757）に塗り替える。

使い方: uv run --with pillow --with numpy --with scipy python -I scripts/recolor_claude_code.py <入力.png>... <出力ディレクトリ>

耳・足・手・アンテナの玉のオレンジだけを塗り替え、RGBA の透明度はそのまま残す。
口の中（赤みが強い・暗い）と目（琥珀色で暗い）は、色相と明るさの平均で外して変えない。
assets/ref/claude_code.png を作ったときと同じ塗り替えの式である。
"""
import colorsys
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

TERRACOTTA = "#D97757"


def recolor(path: str, hexc: str) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)[..., 3]
    hsv = np.asarray(im.convert("RGB").convert("HSV")).astype(float)
    h = hsv[..., 0] * 360 / 255
    s = hsv[..., 1] / 255
    v = hsv[..., 2] / 255
    org = (h >= 8) & (h <= 31) & (s > 0.45) & (v > 0.25) & (a > 0)
    lab, n = nd.label(org)
    idx = np.arange(1, n + 1)
    keep = np.zeros(n + 1, bool)
    keep[1:] = (nd.mean(h, lab, idx) >= 18) & (nd.mean(v, lab, idx) > 0.8)
    m = keep[lab]
    bv, bs = np.median(v[m]), np.median(s[m])
    r, g, b = [int(hexc[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    th, ts, tv = colorsys.rgb_to_hsv(r, g, b)
    rgb = np.asarray(im.convert("RGB")).astype(float) / 255
    rgb[m] = np.array(
        [colorsys.hsv_to_rgb(th, x, y) for x, y in zip(np.clip(s[m] / bs * ts, 0, 1), np.clip(v[m] / bv * tv, 0, 1))]
    )
    return Image.fromarray(np.dstack([(rgb * 255).astype(np.uint8), a]), "RGBA")


if __name__ == "__main__":
    *srcs, out_dir = sys.argv[1:]
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for src in srcs:
        dst = Path(out_dir) / Path(src).name
        recolor(src, TERRACOTTA).save(dst)
        print(dst)

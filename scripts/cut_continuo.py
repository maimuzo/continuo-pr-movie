"""コンティの設定画（緑の背景に4つの姿）から背景を抜き、姿ごとの透明 PNG に切り分ける。

使い方: uv run --with pillow --with numpy --with scipy python -I scripts/cut_continuo.py <設定画.jpeg> <出力ディレクトリ>

背景は scripts/key_green.py と同じ式で抜く。切り分けは四角で切らず、つながった部分（体・潮・泡・星）ごとに
重心がどの姿の範囲にあるかで振り分ける。四角で切ると、隣の姿の潮やヒレが入り込むためである。
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd


def key_alpha(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (excess - 40.0) / 80.0, 0.0, 1.0)
    alpha[(g > 150) & (excess > 120)] = 0.0
    g2 = np.minimum(g, np.maximum(r, b) + 10.0)
    return np.dstack([r, g2, b]), alpha


# 姿ごとの、部品の重心が入る範囲（設定画 1264×848 の座標）。(x0, y0, x1, y1)
POSES = {
    "wave": [(0, 0, 640, 848)],
    "leap": [(640, 0, 1264, 300), (640, 300, 930, 480)],
    "fluster": [(930, 300, 1264, 570)],
    "sleep": [(640, 570, 1264, 848)],
}


def main(src: str, out_dir: str) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    rgb2, alpha = key_alpha(rgb)
    lab, n = nd.label(alpha > 0.06)
    idx = np.arange(1, n + 1)
    areas = nd.sum(np.ones_like(alpha), lab, idx)
    cents = nd.center_of_mass(np.ones_like(alpha), lab, idx)
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for name, boxes in POSES.items():
        keep = np.zeros(n + 1, bool)
        for i, (cy, cx) in enumerate(cents, start=1):
            if areas[i - 1] < 25:  # JPEG のノイズ
                continue
            if any(x0 <= cx < x1 and y0 <= cy < y1 for x0, y0, x1, y1 in boxes):
                keep[i] = True
        mask = keep[lab]
        # 抜いたふちの半透明の画素も、そのとなりの部品に含める
        mask = nd.binary_dilation(mask, iterations=2) & (alpha > 0)
        a = np.where(mask, alpha, 0.0)
        img = Image.fromarray(np.dstack([rgb2, a * 255.0]).astype(np.uint8), "RGBA")
        bbox = img.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
        l, t, r, b = bbox
        pad = 8
        img = img.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, img.width), min(b + pad, img.height)))
        img.save(Path(out_dir) / f"{name}.png")
        print(name, img.size, int(keep.sum()), "parts")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

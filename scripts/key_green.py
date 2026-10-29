"""緑一色の背景（#00FF00）で描かせた絵から背景を抜き、透明な PNG にする。

使い方: uv run --with pillow --with numpy python -I scripts/key_green.py <入力.png> <出力.png>

ffmpeg の colorkey だけでは、輪郭のまわりに緑のにじみが残る。そこで、
緑の強さで透明度を決め、残った緑みを赤と青の大きいほうまで下げてから、絵のある範囲で切り抜く。
"""
import sys

import numpy as np
from PIL import Image


def key(src: str, dst: str) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # 緑の強さ: 緑が赤と青の大きいほうをどれだけ上回るか
    excess = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (excess - 40.0) / 80.0, 0.0, 1.0)
    alpha[(g > 150) & (excess > 120)] = 0.0
    # にじんだ緑を消す
    g2 = np.minimum(g, np.maximum(r, b) + 10.0)
    out = np.dstack([r, g2, b, alpha * 255.0]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    bbox = img.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
    if bbox:
        pad = 8
        l, t, rr, bb = bbox
        img = img.crop((max(l - pad, 0), max(t - pad, 0), min(rr + pad, img.width), min(bb + pad, img.height)))
    img.save(dst)


if __name__ == "__main__":
    key(sys.argv[1], sys.argv[2])

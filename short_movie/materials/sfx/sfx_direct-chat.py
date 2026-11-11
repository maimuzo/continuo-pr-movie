"""Direct Chat の回だけで鳴らす効果音を合成し、short_movie/materials/sfx/direct-chat_*.wav に書き出す。

`uv run --no-project --python 3.12 --with numpy==2.5.4 python -I short_movie/materials/sfx/sfx_direct-chat.py` で作り直す。合成の部品は 同じフォルダの make_sfx.py から借り、make_sfx.py は書き換えない。
- direct_chat_blare: メガホンで指示を出す「ブッ」。のこぎり波を少し割らせた短い音
- direct_chat_zip: 口のチャックを閉める「ジーッ」。細かいクリックを速く並べ、音程を上げていく
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import RATE, env, lowpass, rng, save, t  # noqa: E402


def blare():
    x = t(0.28)
    f = 330 + 40 * np.sin(2 * np.pi * 9 * x)  # 少し揺らして、声を張った感じにする
    phase = np.cumsum(f) / RATE
    saw = 2 * (phase % 1) - 1
    buzz = np.tanh(saw * 3)  # 割れたメガホンの音
    shape = np.minimum(1, x / 0.01) * np.clip((0.28 - x) / 0.06, 0, 1)
    return lowpass(buzz * shape, 0.35)


def zip_():
    out = np.zeros(int(RATE * 0.4))
    n = 22
    for k in range(n):
        d = 0.32 * (k / n) ** 0.9
        x = t(0.012)
        pitch = 1500 + 2500 * k / n
        c = (rng.normal(0, 1, len(x)) * 0.6 + np.sin(2 * np.pi * pitch * x)) * env(len(x), 0.0005, 0.003)
        i = int(d * RATE)
        out[i:i + len(c)] += c
    return out


if __name__ == "__main__":
    save("direct-chat_blare", blare())
    save("direct-chat_zip", zip_())
    print("direct-chat_blare", "direct-chat_zip")

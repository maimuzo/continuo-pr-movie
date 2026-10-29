"""定額のままの回だけで鳴らす効果音を合成して public/sfx/flat_rate_*.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_flat_rate.py` で作り直す。合成の道具は scripts/make_sfx.py から借りる（書き換えない）。
- coin: チャリン。従量課金のレジから硬貨が出るたびに鳴らす
- lock: カチャ。定額のレジに錠が掛かる
- unplug: プツッ。開発者がレジの電源を抜く
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import RATE, click, env, lowpass, rng, save, t  # noqa: E402


def coin():
    """チャリン。金属らしい高い倍音を2度、少しずらして鳴らす"""
    out = np.zeros(int(RATE * 0.6))
    for d, base in [(0.0, 2350), (0.07, 3150)]:
        x = t(0.5)
        s = sum(np.sin(2 * np.pi * base * k * x) * a for k, a in [(1, 1.0), (1.51, 0.5), (2.76, 0.3)])
        s = s * env(len(x), 0.001, 0.12)
        i = int(d * RATE)
        out[i:i + len(s)] += s
    return out


def lock():
    """カチャ。乾いた打音を2つ"""
    out = np.zeros(int(RATE * 0.25))
    for d, p in [(0.0, 900), (0.07, 1400)]:
        k = click(0.05, p)
        i = int(d * RATE)
        out[i:i + len(k)] += k
    body = np.sin(2 * np.pi * 300 * t(0.25)) * env(int(RATE * 0.25), 0.001, 0.03)
    return out + body * 0.4


def unplug():
    """プツッ。短いノイズと、下がる低い音"""
    x = t(0.3)
    n = lowpass(rng.normal(0, 1, len(x)), 0.4) * env(len(x), 0.001, 0.015)
    f = 300 * np.exp(-x * 10) + 60
    core = np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(x), 0.001, 0.08)
    return n + core * 0.9


if __name__ == "__main__":
    for name, make in {"coin": coin, "lock": lock, "unplug": unplug}.items():
        save(f"flat_rate_{name}", make())
        print(f"flat_rate_{name}")

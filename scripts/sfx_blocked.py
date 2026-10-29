"""詰まったらひとことの回だけで鳴らす効果音を、scripts/make_sfx.py の関数で合成して public/sfx/blocked_*.wav に書き出す。

`uv run --with numpy python scripts/sfx_blocked.py` で作り直す（make_sfx.py を import するため -I は付けない）。
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import RATE, env, lowpass, rng, save, t  # noqa: E402


def bonk():
    """ゴン。壁にぶつかる低い胴鳴りに、短い打撃のノイズを足す"""
    x = t(0.45)
    f = 160 * np.exp(-x * 6) + 70
    body = np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(x), 0.001, 0.14)
    ring = np.sin(2 * np.pi * 410 * x) * env(len(x), 0.001, 0.06) * 0.3
    hit = lowpass(rng.normal(0, 1, len(x)), 0.35) * env(len(x), 0.001, 0.015)
    return body + ring + hit * 0.8


def huh():
    """ほえ？ 下がってから上がる、問いかけるような音程"""
    x = t(0.5)
    f = 520 - 120 * np.sin(np.pi * np.minimum(x / 0.25, 1)) + 500 * np.clip((x - 0.25) / 0.25, 0, 1) ** 2
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.sin(np.pi * x / 0.5) * 0.7


def block():
    """コトッ。積み木を置く、木の短い音"""
    x = t(0.16)
    knock = np.sin(2 * np.pi * 900 * x) * env(len(x), 0.0005, 0.02) + np.sin(2 * np.pi * 1450 * x) * env(len(x), 0.0005, 0.012) * 0.5
    tap = lowpass(rng.normal(0, 1, len(x)), 0.6) * env(len(x), 0.0005, 0.004)
    return knock + tap * 0.6


if __name__ == "__main__":
    for name, make in {"blocked_bonk": bonk, "blocked_huh": huh, "blocked_block": block}.items():
        save(name, make())
        print(name)

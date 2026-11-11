"""見える工房の回だけで鳴らす効果音を合成して public/sfx/visible_workshop_*.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_visible_workshop.py` で作り直す。
合成の部品は scripts/make_sfx.py の関数を使い、make_sfx.py は書き換えない。
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_sfx as m  # noqa: E402


def rattle():
    """ガタガタ。低い木箱の打音を、不揃いな間隔で8回"""
    out = np.zeros(int(m.RATE * 1.0))
    at = 0.0
    for _ in range(8):
        x = m.t(0.09)
        f = m.rng.uniform(110, 170)
        knock = np.sin(2 * np.pi * f * x) * m.env(len(x), 0.001, 0.025)
        thud = m.lowpass(m.rng.normal(0, 1, len(x)), 0.15) * m.env(len(x), 0.001, 0.02)
        k = (knock + thud * 0.9) * m.rng.uniform(0.6, 1)
        i = int(at * m.RATE)
        out[i:i + len(k)] += k[: len(out) - i]
        at += m.rng.uniform(0.09, 0.14)
    return out


def clap():
    """パチン。明るい短いノイズを2つ重ね、手を合わせた音にする"""
    x = m.t(0.2)
    n = m.rng.normal(0, 1, len(x))
    hi = (n - m.lowpass(n, 0.2)) * m.env(len(x), 0.0005, 0.018)
    body = m.lowpass(n, 0.35) * m.env(len(x), 0.0005, 0.04)
    out = hi * 1.2 + body * 0.6
    d = int(0.008 * m.RATE)
    out[d:] += out[:-d] * 0.5
    return out


if __name__ == "__main__":
    for name, make in {"rattle": rattle, "clap": clap}.items():
        m.save(f"visible_workshop_{name}", make())
        print(name)

"""他人のコメントの回だけで鳴らす効果音を合成して public/sfx/stranger_comment_*.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_stranger_comment.py` で作り直す。
合成の道具は scripts/make_sfx.py の関数を使う（make_sfx.py は書き換えない）。
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import env, lowpass, save, t  # noqa: E402


def relief():
    """ほっと息をつく「ふう」。柔らかい息の音と、下がっていく温かい1音"""
    x = t(0.6)
    n = len(x)
    breath = lowpass(np.random.default_rng(7).normal(0, 1, n), 0.08) * env(n, 0.08, 0.35) * 1.6
    freq = np.linspace(560, 400, n)
    phase = 2 * np.pi * np.cumsum(freq) / 44100
    tone = (np.sin(phase) + 0.25 * np.sin(2 * phase)) * env(n, 0.03, 0.4) * 0.45
    return lowpass(breath + tone, 0.3) * 0.7


def drop():
    """紙が箱の底に落ちる「とすっ」。低い胴鳴りと短いこすれ"""
    x = t(0.22)
    body = np.sin(2 * np.pi * np.linspace(170, 90, len(x)) * x) * env(len(x), 0.002, 0.05)
    rub = lowpass(np.random.default_rng(3).normal(0, 1, len(x)), 0.2) * env(len(x), 0.002, 0.03)
    return (body + rub * 0.6) * 0.7


if __name__ == "__main__":
    save("stranger_comment_relief", relief())
    save("stranger_comment_drop", drop())

"""チームで入札の回だけで鳴らす効果音を合成して public/sfx/team_bid_*.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_team_bid.py` で作り直す。合成の道具は scripts/make_sfx.py のものを使う。
- team_bid_bid: 燃料計に％が浮かぶ「ピッ」。3台が続けて鳴らすので、短く高い音にする
- team_bid_win: いちばん大きい数字が選ばれた「ピロン」。2音で上がる
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import RATE, env, save, t  # noqa: E402


def bid():
    x = t(0.18)
    return (np.sin(2 * np.pi * 1320 * x) + 0.25 * np.sin(2 * np.pi * 2640 * x)) * env(len(x), 0.002, 0.05)


def win():
    out = np.zeros(int(RATE * 0.5))
    for f, d in [(988, 0.0), (1480, 0.09)]:
        x = t(0.38)
        s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2 * x)) * env(len(x), 0.002, 0.12)
        i = int(d * RATE)
        out[i:i + len(s)] += s
    return out


if __name__ == "__main__":
    save("team_bid_bid", bid())
    save("team_bid_win", win())
    print("team_bid_bid team_bid_win")

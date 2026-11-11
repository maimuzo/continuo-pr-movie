"""止めても続きからの回だけで使う効果音を合成し、public/sfx/resume_{off,on,click,steps}.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_resume.py` で作る。make_sfx.py の関数を借り、make_sfx.py は書き換えない。
off は左の窓が暗くなるときの下がる音、on は明るくなるときの上がる音。
click はディスプレイの電源を切り替える音、steps は開発者が歩く足音。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
from make_sfx import RATE, env, lowpass, save, t  # noqa: E402


def sweep(f0, f1, sec):
    """音程が f0 から f1 へ滑らかに動く、丸い音"""
    x = t(sec)
    f = f0 * (f1 / f0) ** (x / sec)
    ph = 2 * np.pi * np.cumsum(f) / RATE
    return (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.minimum(1, x / 0.01)


def off():
    """ヒューン。下がって消える"""
    s = sweep(880, 140, 0.5)
    return s * np.linspace(1, 0, len(s)) ** 1.5


def on():
    """ポワーン。上がって、最後に明るい音を1つ足す"""
    s = sweep(220, 990, 0.4) * np.sin(np.pi * np.linspace(0, 1, int(RATE * 0.4))) ** 0.5
    x = t(0.35)
    ding = np.sin(2 * np.pi * 1320 * x) * env(len(x), 0.002, 0.12)
    out = np.zeros(len(s) + len(ding) // 2)
    out[: len(s)] += s * 0.7
    out[len(s) - len(ding) // 2:] += ding * 0.6
    return out


def switch_click():
    """カチッ。短い高い音と低い音を続けて鳴らす"""
    rng = np.random.default_rng(3)
    out = np.zeros(int(RATE * 0.12))
    for at, pitch, amp in [(0.0, 2400, 1.0), (0.035, 900, 0.6)]:
        x = t(0.04)
        s = (rng.normal(0, 1, len(x)) * 0.4 + np.sin(2 * np.pi * pitch * x)) * env(len(x), 0.0008, 0.006) * amp
        i = int(RATE * at)
        out[i : i + len(s)] += s
    return out


def steps():
    """トッ、トッ。低い足音を0.16秒おきに5つ"""
    rng = np.random.default_rng(5)
    out = np.zeros(int(RATE * 0.85))
    for k in range(5):
        x = t(0.08)
        s = (np.sin(2 * np.pi * 110 * x) + 0.6 * lowpass(rng.normal(0, 1, len(x)), 0.08)) * env(len(x), 0.002, 0.025)
        i = int(RATE * k * 0.16)
        out[i : i + len(s)] += s * (1.0 if k % 2 == 0 else 0.8)
    return out


if __name__ == "__main__":
    save("resume_off", off())
    save("resume_on", on())
    save("resume_click", switch_click())
    save("resume_steps", steps())

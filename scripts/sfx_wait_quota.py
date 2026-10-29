"""寝て待つ回だけで使う効果音を合成し、public/sfx/wait_quota_*.wav に書き出す。

`uv run --with numpy python -I scripts/sfx_wait_quota.py` で作る。make_sfx.py の関数を借り、make_sfx.py は書き換えない。
empty は電池が空になって座り込むときの下がる音、tick は時計の早回しのチクタク、
bell は壁の時計のベル、charge は電池が満タンへ戻るときの上がる音、
flip は日めくりがパラパラめくれる音、fall は担当者の顔のアイコンが外れて落ちる音。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
from make_sfx import RATE, click, env, save, t  # noqa: E402


def sweep(f0, f1, sec):
    """音程が f0 から f1 へ滑らかに動く、丸い音"""
    x = t(sec)
    f = f0 * (f1 / f0) ** (x / sec)
    ph = 2 * np.pi * np.cumsum(f) / RATE
    return (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.minimum(1, x / 0.01)


def empty():
    """ヒュルル。力の抜ける、下がって消える音"""
    s = sweep(700, 110, 0.7)
    wobble = 1 + 0.3 * np.sin(2 * np.pi * 9 * t(0.7))
    return s * wobble * np.linspace(1, 0, len(s)) ** 1.3


def tick(sec=1.9):
    """チクタクがだんだん速くなる"""
    out = np.zeros(int(RATE * sec))
    pos, gap, k = 0.0, 0.16, 0
    while pos < sec - 0.05:
        c = click(0.04, 2600 if k % 2 == 0 else 2000)
        i = int(pos * RATE)
        out[i:i + len(c)] += c[: len(out) - i]
        pos += gap
        gap = max(0.045, gap * 0.9)
        k += 1
    return out


def bell(sec=1.0):
    """ジリリリ。高い金属音を細かく打ち続ける"""
    x = t(sec)
    tone = np.sin(2 * np.pi * 2350 * x) + 0.6 * np.sin(2 * np.pi * 3170 * x) + 0.3 * np.sin(2 * np.pi * 4810 * x)
    hammer = (np.sin(2 * np.pi * 22 * x) > 0).astype(float) * 0.7 + 0.3
    fade = np.minimum(1, x / 0.005) * np.clip((sec - x) / 0.25, 0, 1)
    return tone * hammer * fade


def charge():
    """ギュイーン。上がって、最後に明るい音を1つ足す"""
    s = sweep(180, 1200, 0.45) * np.sin(np.pi * np.linspace(0, 1, int(RATE * 0.45))) ** 0.4
    x = t(0.4)
    ding = (np.sin(2 * np.pi * 1568 * x) + 0.4 * np.sin(2 * np.pi * 2093 * x)) * env(len(x), 0.002, 0.14)
    out = np.zeros(len(s) + len(ding) // 2)
    out[: len(s)] += s * 0.7
    out[len(s) - len(ding) // 2:] += ding * 0.6
    return out


def flip(sec=1.2, n=7):
    """パラパラ。紙をめくるかすれた音を n 回、少しずつ間を詰めて鳴らす"""
    out = np.zeros(int(RATE * sec))
    pos, gap = 0.0, 0.2
    rng = np.random.default_rng(3)
    for _ in range(n):
        x = t(0.07)
        noise = rng.standard_normal(len(x))
        hi = np.diff(noise, prepend=0.0)
        s = hi * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2 * 0.5
        i = int(pos * RATE)
        out[i:i + len(s)] += s[: len(out) - i]
        pos += gap
        gap = max(0.12, gap * 0.92)
    return out


def fall():
    """ヒューッ、ポトッ。下がる笛の音のあとに、軽く落ちる音"""
    s = sweep(1500, 420, 0.38) * 0.45 * np.linspace(1, 0.6, int(RATE * 0.38))
    x = t(0.18)
    thud = (np.sin(2 * np.pi * 160 * x) + 0.5 * np.sin(2 * np.pi * 330 * x)) * env(len(x), 0.002, 0.05)
    out = np.zeros(len(s) + len(thud))
    out[: len(s)] += s
    out[len(s):] += thud
    return out


if __name__ == "__main__":
    save("wait_quota_empty", empty())
    save("wait_quota_tick", tick())
    save("wait_quota_bell", bell())
    save("wait_quota_charge", charge())
    save("wait_quota_flip", flip())
    save("wait_quota_fall", fall())

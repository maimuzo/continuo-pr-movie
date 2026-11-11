"""動画で鳴らす効果音を、数式で合成して public/sfx/*.wav に書き出す。

素材を持ってこないので、権利の確認も人の手も要らない。
`uv run --with numpy python -I scripts/make_sfx.py` で全部を作り直す。どの音も 44.1kHz・16bit・モノラル。
"""
import os
import wave

import numpy as np

RATE = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "sfx")
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(RATE * sec)) / RATE


def env(n, attack=0.005, decay=0.1):
    """立ち上がって指数で減る音量の形"""
    x = np.arange(n) / RATE
    return np.minimum(1, x / attack) * np.exp(-x / decay)


def lowpass(x, a):
    """1次の簡単な高域カット。a は 0〜1 で、小さいほど丸い音になる"""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def click(sec=0.05, pitch=1800):
    """キーを1つ打つ音"""
    x = t(sec)
    return (rng.normal(0, 1, len(x)) * 0.5 + np.sin(2 * np.pi * pitch * x)) * env(len(x), 0.001, 0.008)


def typing():
    """カタカタ。不揃いな間隔で11打"""
    out = np.zeros(int(RATE * 1.05))
    at = 0.0
    for _ in range(11):
        c = click(pitch=rng.uniform(1500, 2300)) * rng.uniform(0.5, 1)
        i = int(at * RATE)
        out[i:i + len(c)] += c[: len(out) - i]
        at += rng.uniform(0.07, 0.11)
    return out * 0.5


def enter():
    """ターン。打つ音に低い胴鳴りを足す"""
    x = t(0.25)
    body = np.sin(2 * np.pi * 180 * x) * env(len(x), 0.001, 0.05)
    c = np.zeros(len(x))
    k = click(0.06, 1200)
    c[: len(k)] = k
    return c * 0.9 + body * 0.8


def whoosh(sec=0.9):
    """シュー。ノイズの明るさを山なりに変える"""
    x = t(sec)
    n = rng.normal(0, 1, len(x))
    shape = np.sin(np.pi * x / sec) ** 2
    bright = lowpass(n, 0.08) * shape + lowpass(n, 0.3) * shape ** 3 * 0.5
    return bright * 1.6


def splat():
    """ペタッ。短いノイズを低めに丸め、音程の下がる芯を足す"""
    x = t(0.18)
    n = lowpass(rng.normal(0, 1, len(x)), 0.25) * env(len(x), 0.001, 0.03)
    f = 420 * np.exp(-x * 18) + 120
    core = np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(x), 0.001, 0.05)
    return n * 1.4 + core * 0.7


def spout():
    """ピュー。上がる音程に、水しぶきのノイズを重ねる"""
    x = t(0.6)
    f = 500 + 1300 * (x / 0.6) ** 0.6
    tone = np.sin(2 * np.pi * np.cumsum(f) / RATE) * np.sin(np.pi * x / 0.6) * 0.5
    spray = lowpass(rng.normal(0, 1, len(x)), 0.5) * np.sin(np.pi * x / 0.6) ** 2 * 0.35
    return tone + spray


def swish():
    """スッ。短いシュー"""
    return whoosh(0.3) * 0.8


def sparkle():
    """キラン。高い音を3つ、少しずらして重ねる"""
    out = np.zeros(int(RATE * 0.7))
    for k, (f, d) in enumerate([(1568, 0.0), (2093, 0.06), (3136, 0.12)]):
        x = t(0.55)
        s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2 * x)) * env(len(x), 0.002, 0.18)
        i = int(d * RATE)
        out[i:i + len(s)] += s * (0.5 - k * 0.1)
    return out


def pop():
    """ポン。音程が少し下がる丸い音"""
    x = t(0.35)
    f = 660 * np.exp(-x * 4) + 330
    return np.sin(2 * np.pi * np.cumsum(f) / RATE) * env(len(x), 0.002, 0.09)


SOUNDS = {"typing": typing, "enter": enter, "whoosh": whoosh, "splat": splat,
          "spout": spout, "swish": swish, "sparkle": sparkle, "pop": pop}


def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.85  # どの音も同じ最大音量にそろえ、音量は動画の側で決める
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, make in SOUNDS.items():
        save(name, make())
        print(name)

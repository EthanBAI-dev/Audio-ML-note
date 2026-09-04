# -*- coding: utf-8 -*-
"""第 02 课 · 琴键编号和赫兹之间怎么换算。

跑法（在 project/ 目录下）：
    python lessons/lesson02_pitch_and_hz.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

from soundlab import io
from soundlab.figdata import dump, thin

A4 = 440.0        # 人为约定，不是物理常数。乐团用 442 的话整套跟着变。


def midi_to_hz(m, a4=A4):
    """琴键编号 → 赫兹。编号每加 12，频率翻一倍。"""
    return a4 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def hz_to_midi(f, a4=A4):
    """赫兹 → 琴键编号。结果不是整数，说明这个音跑调了。"""
    return 69 + 12 * np.log2(np.asarray(f, dtype=float) / a4)


def cents(f1, f2):
    """两个频率相差多少音分。一个半音等于 100 音分。"""
    return 1200 * np.log2(f2 / f1)


def step1_2_lookup():
    print("[正文] 第 1、2 步 · 查一个音")
    print(f"  编号 72（C5）= {midi_to_hz(72):.2f} Hz")
    print(f"  编号 69（A4）= {midi_to_hz(69):.2f} Hz   ← 这是基准，定义出来的")
    print()


def step3_octave():
    print("[正文] 第 3 步 · 验证「加 12 = 乘 2」")
    for m in (60, 69, 72, 81):
        lo, hi = midi_to_hz(m), midi_to_hz(m + 12)
        print(f"  {m:3d} {lo:8.2f} Hz  ->  {m + 12:3d} {hi:8.2f} Hz   "
              f"倍数 {hi / lo:.4f}")
    print("  四行的倍数都是 2.0000。这不是巧合：公式里 2 的指数正好加了 1。")
    print()


def level_cents():
    print("[正文] 加一层 · 比半音更细的差别，用音分")
    print(f"  440 Hz 和 445 Hz 相差 {cents(440, 445):.2f} 音分，约五分之一个半音")
    print("  取对数的好处：相同的频率比，永远换算出相同的音分数——")
    for lo in (220.0, 440.0, 880.0):
        print(f"    {lo:6.1f} Hz 到 {lo * 1.01:7.2f} Hz（都高 1%）"
              f"= {cents(lo, lo * 1.01):.2f} 音分")
    print()


def level_back():
    print("[正文] 加一层 · 反过来，从赫兹找编号")
    for f in (261.63, 440.0, 523.25):
        print(f"  {f:7.2f} Hz -> 编号 {hz_to_midi(f):.3f}")
    print("  结果不是整数就说明跑调了，小数部分乘 100 就是偏了多少音分。")
    print()


def level_real_audio():
    print("[正文] 加一层 · 用在真实录音上")
    for name in ("violin_c", "piano_c"):
        y, sr = io.load(name)
        f0 = librosa.yin(y, fmin=100, fmax=1000, sr=sr)
        med = float(np.median(f0))
        m = float(hz_to_midi(med))
        print(f"  {name:9} 估出 {med:7.1f} Hz -> 编号 {m:5.1f}，"
              f"离最近的整数编号差 {abs(m - round(m)) * 100:.0f} 音分")
    print("  差十几音分是正常的演奏和估计误差。差 100 以上就不是误差，是找错了八度。")
    print("  注意 fmin / fmax 必须自己给：给错了范围，算法会在错误的区间里")
    print("  找出一个「最像」的答案，而且不会报错。")
    print()


def extra_wrong_range():
    """正文没放：把搜索范围给错，会得到什么。"""
    print("[脚本额外] 把音高搜索范围给错，结果会怎样")
    y, sr = io.load("violin_c")
    for lo, hi in [(100, 1000), (400, 2000), (30, 200)]:
        f0 = librosa.yin(y, fmin=lo, fmax=hi, sr=sr)
        med = float(np.median(f0))
        print(f"  fmin={lo:4d} fmax={hi:5d} -> {med:7.1f} Hz "
              f"（编号 {float(hz_to_midi(med)):.1f}）")
    print("  真实音高在 260 Hz 附近。范围一旦不包含它，函数照样返回一个数，")
    print("  只是那个数落在你给的区间里——这类错误不会报错，只会安静地错下去。")
    print()


def extra_a4_convention():
    """正文没放：换一个基准音，整套编号对应的赫兹全变。"""
    print("[脚本额外] 乐团把 A4 定成 442 Hz，同一个编号差多少")
    for m in (60, 69, 81):
        a, b = midi_to_hz(m, 440.0), midi_to_hz(m, 442.0)
        print(f"  编号 {m:3d}: A4=440 时 {a:8.2f} Hz，A4=442 时 {b:8.2f} Hz，"
              f"差 {cents(a, b):.1f} 音分")
    print("  差 7.9 音分，每个编号都一样——因为它是整体乘了同一个比例。")
    print("  所以「A4 = 440」是必须记录的参数，不是常识。")
    print()


def dump_figures():
    """这一课要上图的数：周期/非周期的真实波形、听觉范围、编号与赫兹。"""
    # 周期性用小提琴的稳态段，非周期性用课程自带的噪声。
    # 都截 30 毫秒：再长的话小提琴那条会挤成一团，看不出「一段图案在重复」。
    ms = 30
    vio, sr = io.load("violin_c", seconds=2.0)
    noi, _ = io.load("noise", seconds=2.0)
    n = int(sr * ms / 1000)
    # 各自从中段取，避开起音和收尾
    vseg = vio[len(vio) // 2: len(vio) // 2 + n]
    nseg = noi[len(noi) // 2: len(noi) // 2 + n]
    # 各自按自身峰值归一化：这张图比的是形状重不重复，不是谁更响
    vseg = vseg / max(abs(vseg).max(), 1e-9)
    nseg = nseg / max(abs(nseg).max(), 1e-9)

    path = dump(2, {
        "periodic": {
            "ms": ms, "sr": int(sr),
            "violin": thin(vseg, 600),
            "noise": thin(nseg, 600),
        },
        "hearing": {
            "low": 20, "high": 20000,
            # 常见声音的大致频率位置，用于在对数轴上标点
            "marks": [
                {"name": "次声", "hz": 8, "inside": False},
                {"name": "最低的钢琴音", "hz": 27.5, "inside": True},
                {"name": "男声基频", "hz": 110, "inside": True},
                {"name": "女声基频", "hz": 220, "inside": True},
                {"name": "A4 标准音", "hz": 440, "inside": True},
                {"name": "最高的钢琴音", "hz": 4186, "inside": True},
                {"name": "镲片的亮部", "hz": 12000, "inside": True},
                {"name": "超声", "hz": 40000, "inside": False},
            ],
        },
        "octave": [
            {"from_hz": 220, "to_hz": 440},
            {"from_hz": 440, "to_hz": 880},
            {"from_hz": 880, "to_hz": 1760},
        ],
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    step1_2_lookup()
    step3_octave()
    level_cents()
    level_back()
    level_real_audio()
    extra_wrong_range()
    extra_a4_convention()
    if "--dump" in sys.argv:
        dump_figures()

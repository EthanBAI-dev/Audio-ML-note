# -*- coding: utf-8 -*-
"""第 04 课 · 采样率和位深：录音时定下的两个数。

跑法（在 project/ 目录下）：
    python lessons/lesson04_sampling_and_bitdepth.py

实验分两半：前半让三个不同的频率在同一个采样率下留下一模一样的数值
（混叠，不可修复）；后半量化，看它的代价为什么是渐变的。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io


def alias(f, fs):
    """真实频率 f 在采样率 fs 下会被看成哪个频率。"""
    k = round(f / fs)
    return abs(f - k * fs)


def quantize(x, bits):
    """把 [-1, 1] 分成 2**bits - 1 个等宽台阶，每个数就近取一个台阶。

    这是教学式量化器：把 -1 和 +1 都当成网格端点。真实设备的定义
    略有不同（常见的是 2**bits 个台阶、不对称），换算信噪比时要注意。
    """
    step = 2.0 / (2 ** bits - 1)
    return np.round((np.clip(x, -1, 1) + 1) / step) * step - 1


def step1_2_alias():
    print("[正文] 第 1、2 步 · 用每秒 10 次的采样率去测三个不同的信号")
    fs = 10.0
    for f in (3, 7, 13):
        print(f"  真实 {f:>2} Hz, fs={fs:.0f} -> 看起来像 {alias(f, fs):.0f} Hz")
    print(f"  判据只有一条：频率超过采样率的一半（{fs / 2:.0f} Hz）就会混叠。")
    print()


def step3_same_samples():
    print("[正文] 第 3 步 · 三条曲线在采样点上完全重合")
    fs = 10.0
    n = np.arange(11)
    vals = {}
    for f in (3, 7, 13):
        vals[f] = np.sin(2 * np.pi * f * n / fs)
        print(f"  {f:>2} Hz:", " ".join(f"{v:+.3f}" for v in vals[f]))
    print(f"  3 Hz 和 13 Hz 的采样值完全相同？{np.allclose(vals[3], vals[13])}")
    print(f"  7 Hz 是 3 Hz 的相反数？{np.allclose(vals[7], -vals[3])}")
    print("  三行数字放在一起，就是「无法区分」的字面含义：")
    print("  没有任何算法能从这 11 个数里还原出原来是哪一条。混叠不可修复。")
    print()


def level_quantize():
    print("[正文] 加一层 · 第二处取舍：量化")
    B, x = 3, 0.37
    step = 2 / (2 ** B - 1)
    q = float(quantize(np.array(x), B))
    print(f"  位深 {B} 位 -> {2 ** B} 个档位，步长 {step:.4f}")
    print(f"  x = {x}   量化成 q = {q:.4f}   误差 {x - q:+.4f}")
    print("  和混叠不同，这个代价是渐变的：档位粗一点只是误差大一点，")
    print("  不会把一个声音变成另一个声音。")
    print()


def level_sqnr():
    print("[正文] 加一层 · 位深换算成信噪比")
    for B in (8, 16, 24):
        print(f"  {B:>2} bit: SQNR ≈ {6.02 * B + 1.76:.2f} dB")
    print("  这是理想均匀量化器 + 满幅正弦输入的理论上限，不是设备保证值。")
    print("  模拟前端噪声、失真、时钟抖动都会让实测值低于它。")
    print()


def level_cost():
    print("[正文] 加一层 · 算成本")
    fs, B, C = 44100, 16, 2
    rate = fs * B * C
    print(f"  fs={fs} B={B} 声道={C}")
    print(f"  码率 = {rate} bit/s ；10 分钟 = {rate * 600 / 8 / 1e6:.2f} MB")
    print("  采样率翻一倍、位深从 16 换成 24，文件和后面每一步的计算量都成正比地涨。")
    print()


def extra_measured_sqnr():
    """正文没放：实测的量化噪声，和公式对得上吗。"""
    print("[脚本额外] 实测量化噪声，和 6.02B + 1.76 对得上吗")
    sr = 44100
    t = np.arange(sr) / sr
    x = np.sin(2 * np.pi * 997 * t)          # 满幅正弦，997 Hz 是测量常用频率
    print(f"  {'位深':>5}{'理论 dB':>10}{'实测 dB':>10}{'差':>8}")
    for B in (4, 8, 12, 16):
        q = quantize(x, B)
        err = x - q
        measured = 10 * np.log10(np.mean(x ** 2) / np.mean(err ** 2))
        theory = 6.02 * B + 1.76
        print(f"  {B:>5}{theory:10.2f}{measured:10.2f}{measured - theory:+8.2f}")
    print("  8 位以上时实测和理论几乎完全重合；4 位时低 0.16 dB，因为台阶太粗，")
    print("  「误差均匀分布在半个台阶内」这个前提开始不成立。")
    print("  这条规律最值钱的部分是斜率：位深每加 1 位，约多 6 dB。")
    print()


def extra_real_resample():
    """正文没放：降采样时不先滤波，高频会折到哪里去。"""
    print("[脚本额外] 降采样不先滤波，那个 8000 Hz 的音跑到哪里去了")
    import librosa
    # 用 20000 而不是课程的 22050，是为了让降采样后的采样率是整数，
    # 试探波才能和信号严格对齐——否则读数会被一点点频率误差抹掉。
    sr, k = 20000, 4
    new_sr = sr // k                              # 5000 Hz，一半是 2500 Hz
    t = np.arange(sr) / sr
    x = np.sin(2 * np.pi * 300 * t) + 0.5 * np.sin(2 * np.pi * 8000 * t)

    def read(y, s, f):
        """用第 10 课的试探法，读出 f 这个频率在 y 里有多强。"""
        tt = np.arange(len(y)) / s
        a = 2 * np.mean(y * np.sin(2 * np.pi * f * tt))
        b = 2 * np.mean(y * np.cos(2 * np.pi * f * tt))
        return float(np.hypot(a, b))

    folded = alias(8000, new_sr)
    naive = x[::k]
    proper = librosa.resample(x, orig_sr=sr, target_sr=new_sr)
    print(f"  原信号：300 Hz 幅度 1.0 ＋ 8000 Hz 幅度 0.5，采样率 {sr}")
    print(f"  降到 {new_sr} Hz，一半是 {new_sr / 2:.0f} Hz，8000 Hz 超了，"
          f"会折回 {folded:.0f} Hz")
    print(f"  {'':16}{'300 Hz':>10}{f'{folded:.0f} Hz':>10}")
    print(f"  {'直接每 4 个取 1':16}{read(naive, new_sr, 300):10.4f}"
          f"{read(naive, new_sr, folded):10.4f}")
    print(f"  {'先滤波再降采样':16}{read(proper, new_sr, 300):10.4f}"
          f"{read(proper, new_sr, folded):10.4f}")
    print(f"  直接抽样那一行：{folded:.0f} Hz 处凭空冒出 {read(naive, new_sr, folded):.2f}——"
          "正是那个 8000 Hz 折回来的，")
    print("  而原信号在这个频率上本来什么都没有。它已经和真实的低频混在一起，事后分不出来。")
    print("  先滤波那一行几乎是 0：高过一半采样率的成分在降之前就被去掉了。")
    print()


if __name__ == "__main__":
    step1_2_alias()
    step3_same_samples()
    level_quantize()
    level_sqnr()
    level_cost()
    extra_measured_sqnr()
    extra_real_resample()

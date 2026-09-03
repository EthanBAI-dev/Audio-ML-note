# -*- coding: utf-8 -*-
"""第 10 课 · 拿一支已知频率的波去乘，再求平均——傅里叶变换的直觉。

跑法（在 project/ 目录下）：
    python lessons/lesson10_fourier_intuition.py

这一课不写特征，只用乘法和平均把两个频率从一团混合波形里挑出来。
带 [正文] 的段落是文章里出现过的。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.probe import probe, magnitude, phase, sweep

SR = 4000                     # 这一课用一个小采样率，1 秒正好 4000 个数
T = np.arange(SR) / SR


def make_signal(kind="sin"):
    """两支波叠在一起：440 Hz 幅度 1.0，880 Hz 幅度 0.5。

    kind="cos" 含有的频率和强度完全一样，只是起点挪了四分之一圈。
    单支试探波却会给出完全不同的读数——这是第 3 步要演示的。
    """
    f = np.sin if kind == "sin" else np.cos
    return f(2 * np.pi * 440 * T) + 0.5 * f(2 * np.pi * 880 * T)


def step1_probe():
    print("[正文] 第 1 步 · 拿一支已知频率的波去乘，再求平均")
    sig = make_signal()
    for f in (440, 500, 880):
        print(f"  用 {f:4d} Hz 试探：相乘求平均再乘 2 = {probe(sig, f, SR):+.4f}")
    print("  440 得到 1.0000，正是它在信号里的幅度；880 得到 0.5000，也对上了。")
    print("  500 得到 0.0000：信号里没有这个频率，正负部分完全抵消。")
    print()
    return sig


def step2_sweep(sig):
    print("[正文] 第 2 步 · 把试探频率从 100 扫到 2000，每个记一个数")
    freqs = np.arange(100, 2001, 2.0)
    mags = sweep(sig, freqs, SR)
    top = np.argsort(mags)[::-1][:2]
    print(f"  一共试了 {len(freqs)} 个频率")
    for i in sorted(top):
        print(f"    最高的两处：{freqs[i]:6.0f} Hz  读数 {mags[i]:.4f}")
    others = [m for j, m in enumerate(mags) if j not in top]
    print(f"  其余 {len(others)} 个频率的读数最大只有 {max(others):.4f}")
    print("  这条曲线就是频谱：横轴是试探频率，纵轴是这个频率在信号里有多强。")
    print()
    return freqs, mags


def step3_phase():
    print("[正文] 第 3 步 · 只把起点挪四分之一圈，一支试探波就问不出东西了")
    a, b = make_signal("sin"), make_signal("cos")
    print(f"  两条波形逐点相同吗？{np.allclose(a, b)}")
    print(f"  但它们含有的频率和强度完全一样：均方根 "
          f"{np.sqrt(np.mean(a ** 2)):.4f} 对 {np.sqrt(np.mean(b ** 2)):.4f}，"
          f"差别只在起点位置")
    print(f"  一支正弦试探波，在 440 Hz 上：原信号 {probe(a, 440, SR):+.4f}，"
          f"挪过起点的 {probe(b, 440, SR):+.4f}")
    print("  第二个是 0——不是这段声音里没有 440 Hz，是试探波和它错开了四分之一圈。")
    print(f"  换成两支（正弦一支、余弦一支）取直角边长："
          f"{magnitude(a, 440, SR):.4f} 和 {magnitude(b, 440, SR):.4f}")
    print("  两支合起来，起点挪到哪里读数都一样。这就是后面为什么要用复数。")
    print(f"  顺带，两支还能给出起点位置：{phase(a, 440, SR):+.4f} 和 "
          f"{phase(b, 440, SR):+.4f} 弧度，差 {np.pi / 2:.4f}，正好四分之一圈。")
    print()


def extra_reconstruct(sig):
    """正文没放：把扫出来的成分加回去，看能不能拼回原波形。"""
    print("[脚本额外] 用扫出来的两个成分，把原波形拼回来")
    rebuilt = np.zeros_like(sig)
    for f in (440, 880):
        a_sin = probe(sig, f, SR, "sin")
        a_cos = probe(sig, f, SR, "cos")
        rebuilt += a_sin * np.sin(2 * np.pi * f * T) + a_cos * np.cos(2 * np.pi * f * T)
    err = np.abs(rebuilt - sig).max()
    print(f"  只用 440 和 880 两个频率重建，逐点最大误差 {err:.2e}")
    print("  误差是浮点运算的残渣。信号本来就只由这两支波组成，所以能完全拼回来。")
    print()


def extra_real_audio():
    """正文没放：同样的试探，用在真实录音上。"""
    print("[脚本额外] 同一套试探，用在真实钢琴录音上")
    y, sr = io.load("piano_c", seconds=1.0)
    n = len(y)
    t = np.arange(n) / sr

    def mag_at(f):
        s = 2 * np.mean(y * np.sin(2 * np.pi * f * t))
        c = 2 * np.mean(y * np.cos(2 * np.pi * f * t))
        return float(np.hypot(s, c))

    freqs = np.arange(100, 2001, 1.0)
    m = np.array([mag_at(f) for f in freqs])
    peak = freqs[int(np.argmax(m))]
    print(f"  1 秒钢琴录音，扫 100–2000 Hz，最高点在 {peak:.0f} Hz，读数 {m.max():.4f}")
    for k in (1, 2, 3):
        f = peak * k
        if f <= 2000:
            print(f"    {k} 倍处 {f:6.0f} Hz 读数 {mag_at(f):.4f}")
    print(f"  {peak:.0f} Hz 离标准的 C5（523 Hz）很近，这段录音弹的就是这个音。")
    print("  2 倍处还有主峰 14% 的读数，3 倍处几乎没有——这些整数倍叫泛音。")
    print("  第 03 课说过「同一个音高、不同乐器听起来不一样」，差别就在泛音的分布上。")
    print()


def extra_time_lost():
    """正文没放：整段做一次，时间信息就没了。"""
    print("[脚本额外] 整段做一次试探，「先低后高」和「先高后低」分得开吗")
    half = SR // 2
    up = np.concatenate([np.sin(2 * np.pi * 440 * T[:half]),
                         np.sin(2 * np.pi * 880 * T[half:])])
    down = np.concatenate([np.sin(2 * np.pi * 880 * T[:half]),
                           np.sin(2 * np.pi * 440 * T[half:])])
    print(f"  {'':14}{'440 Hz':>10}{'880 Hz':>10}")
    for nm, s in [("先低后高", up), ("先高后低", down)]:
        print(f"  {nm:14}{magnitude(s, 440, SR):10.4f}{magnitude(s, 880, SR):10.4f}")
    print("  两段声音顺序完全相反，整段扫出来的读数几乎一样。")
    print("  时间信息在「求平均」那一步就被抹掉了。第 15 课的短时傅里叶变换")
    print("  就是为了把它找回来：先分帧，再对每一帧各做一次。")
    print()


if __name__ == "__main__":
    print(f"采样率 {SR}，取 1 秒，信号 = 440 Hz 幅度 1.0 + 880 Hz 幅度 0.5\n")
    sig = step1_probe()
    step2_sweep(sig)
    step3_phase()
    extra_reconstruct(sig)
    extra_real_audio()
    extra_time_lost()

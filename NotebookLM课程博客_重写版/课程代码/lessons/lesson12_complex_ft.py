# -*- coding: utf-8 -*-
"""第 12 课 · 复数形式的傅里叶变换。

跑法（在 project/ 目录下）：
    python lessons/lesson12_complex_ft.py

对应 source_course/12 - Defining the Fourier transform using complex numbers/PDF。
PPT 的顺序是：直觉（把强度和相位当极坐标，编码进一个复数）→ 复数傅里叶
系数 → 复数形式的傅里叶变换 → 幅度谱 → 幅度与相位 → 逆变换 →
傅里叶表示（纯音、加权、加相位、全部叠加）→ 一次完整往返。

这一课要证明的就一件事：**变换过去再变换回来，能一个数不差地拼回原信号。**
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.figdata import dump, thin
from soundlab.probe import probe, magnitude, phase

SR = 4000


def make_signal():
    """和第 10、11 课同一个信号：440 Hz 幅度 1.0 ＋ 880 Hz 幅度 0.5。"""
    t = np.arange(SR) / SR
    return np.sin(2 * np.pi * 440 * t) + 0.5 * np.sin(2 * np.pi * 880 * t)


def step1_one_coefficient(sig):
    """PPT p7/p8：一个频率对应一个复数系数。"""
    print("[正文] 第 1 步 · 一个频率，一个复数系数")
    f = 440.0
    a_cos = probe(sig, f, SR, "cos")
    a_sin = probe(sig, f, SR, "sin")
    c = complex(a_cos, a_sin)
    print(f"  在 {f:.0f} Hz 上，两支试探波给出 {a_cos:+.4f} 和 {a_sin:+.4f}")
    print(f"  写成一个复数系数 c = {c.real:+.4f}{c.imag:+.4f}i")
    print(f"    |c| = {abs(c):.4f}   ← 幅度：这个频率有多强")
    print(f"    ∠c  = {np.angle(c):+.4f} 弧度   ← 相位：从哪里起步")
    print("  PPT 把这一步叫「把两个系数编码进一个复数」。")
    print("  第 11 课已经验证过：模就是强度，角就是相位。")
    print()
    return c


def step2_formula(sig):
    """PPT p23–p37：把「乘 + 求平均」写成一条式子。

    我们一直在做的是：拿 cos 和 sin 两支去乘再求平均。欧拉公式把这两支
    合成一个 e^(-i2πft)，于是两次相乘变成一次复数相乘。
    """
    print("[正文] 第 2 步 · 两支试探波，写成一个 e 的指数")
    f = 440.0
    n = np.arange(len(sig))
    t = n / SR
    # 手工版：两支分别乘再求平均
    by_hand = complex(2 * np.mean(sig * np.cos(2 * np.pi * f * t)),
                      2 * np.mean(sig * np.sin(2 * np.pi * f * t)))
    # 复数版：一次乘完
    by_complex = 2 * np.mean(sig * np.exp(-1j * 2 * np.pi * f * t))
    # 注意共轭：exp(-i...) 出来的虚部符号和「正弦那支」相反
    by_complex = complex(by_complex.real, -by_complex.imag)
    print(f"  两支分开算：{by_hand.real:+.4f}{by_hand.imag:+.4f}i")
    print(f"  合成一个 e 的指数算：{by_complex.real:+.4f}{by_complex.imag:+.4f}i")
    print(f"  两者一致：{bool(np.isclose(by_hand, by_complex))}")
    print("  e^(-i2πft) = cos(2πft) − i·sin(2πft)——欧拉公式把两支装进了一个式子。")
    print("  所以傅里叶变换那条吓人的公式，做的还是「乘一支波，再求平均」。")
    print()
    return by_hand, by_complex


def step3_magnitude_phase(sig):
    """PPT p38/p39：幅度谱和相位谱。"""
    print("[正文] 第 3 步 · 幅度谱和相位谱：同一次变换的两半")
    freqs = np.arange(100, 2001, 2.0)
    t = np.arange(len(sig)) / SR
    coef = np.array([2 * np.mean(sig * np.exp(-1j * 2 * np.pi * f * t))
                     for f in freqs])
    mag = np.abs(coef)
    ph = np.angle(coef)
    top = np.argsort(mag)[-2:][::-1]
    print(f"  扫 {len(freqs)} 个频率，每个得到一个复数系数。")
    print("  取模 -> 幅度谱；取角 -> 相位谱。两条谱来自同一次变换。")
    for i in sorted(top):
        print(f"    {freqs[i]:7.0f} Hz   幅度 {mag[i]:.4f}   "
              f"相位 {ph[i]:+.4f} 弧度")
    # 没有的频率上，幅度接近零，相位就没有意义了
    quiet = int(np.argmin(mag))
    print(f"  而在没有成分的地方，比如 {freqs[quiet]:.0f} Hz，"
          f"幅度只有 {mag[quiet]:.2e}，")
    print(f"  这时相位读数 {ph[quiet]:+.4f} 是噪声，没有意义——")
    print("  幅度接近零时，角是由浮点残渣决定的。这一点第 16 课还会遇到。")
    print()
    return freqs, mag, ph


def step4_roundtrip(sig, freqs, mag, ph):
    """PPT p44–p50：逆变换，一次完整往返。"""
    print("[正文] 第 4 步 · 一次完整往返：变过去，再变回来")
    t = np.arange(len(sig)) / SR
    # 只用幅度最高的那两个频率重建
    idx = np.argsort(mag)[-2:]
    rec = np.zeros_like(sig)
    print("  PPT 的三步：取一个纯音 → 用幅度加权 → 加上相位 → 全部叠加。")
    # 必须用 cos。系数是按 c = 2·mean(x·e^(-i2πft)) 定义的，
    # 和它配套的重建式子是 x = |c|·cos(2πft + ∠c)。
    # 写成 sin 的话，对 x = A·sin(2πft) 这种信号会整体错四分之一圈——
    # 试过，带相位反而比不带相位误差还大，一看就知道式子配错了。
    for i in sorted(idx):
        rec = rec + mag[i] * np.cos(2 * np.pi * freqs[i] * t + ph[i])
        print(f"    叠加 {freqs[i]:7.0f} Hz：幅度 {mag[i]:.4f}，"
              f"相位 {ph[i]:+.4f}")
    err = float(np.max(np.abs(rec - sig)))
    print(f"  重建后逐点最大误差 {err:.3e}")
    print("  只用两个成分就拼回来了，因为这个信号本来就只由两支波组成。")
    print()

    # 把相位扔掉会怎样——这是「幅度谱不等于全部信息」的直接证据
    rec_nophase = np.zeros_like(sig)
    for i in sorted(idx):
        rec_nophase = rec_nophase + mag[i] * np.cos(2 * np.pi * freqs[i] * t)
    err2 = float(np.max(np.abs(rec_nophase - sig)))
    print(f"  如果把相位全部当成 0 再重建：逐点最大误差 {err2:.4f}")
    print(f"  比带相位那次大了 {err2 / max(err, 1e-18):.1e} 倍。")
    print("  幅度谱只是变换结果的一半；丢掉相位，波形就拼不回来了。")
    print()
    return rec, err, rec_nophase, err2


def extra_real_audio():
    """正文没放：真实录音上走一次往返，用 numpy 的 fft。"""
    print("[脚本额外] 真实录音上走一次往返（这次用 numpy 的 fft）")
    y, sr = io.load("piano_c", seconds=1.0)
    X = np.fft.rfft(y)
    back = np.fft.irfft(X, n=len(y))
    err = float(np.max(np.abs(back - y)))
    print(f"  {len(y)} 个样本，rfft 得到 {len(X)} 个复数系数")
    print(f"  irfft 变回来，逐点最大误差 {err:.3e}")
    print("  真实录音同样能完整拼回——可逆这件事和信号复杂不复杂无关。")
    # 只留幅度、扔掉相位
    back2 = np.fft.irfft(np.abs(X), n=len(y))
    err2 = float(np.max(np.abs(back2 - y)))
    print(f"  只留幅度、把相位清零再变回来：逐点最大误差 {err2:.4f}")
    print("  差了好几个数量级。相位不是可有可无的附加信息。")
    print()


def dump_figures(sig, c, freqs, mag, ph, rec, err, rec_nophase, err2):
    keep = freqs <= 1200
    path = dump(12, {
        "sr": SR,
        "c": [float(c.real), float(c.imag)],
        "c_mag": float(abs(c)), "c_ang": float(np.angle(c)),
        "freqs": [float(v) for v in freqs[keep]],
        "mag": [round(float(v), 5) for v in mag[keep]],
        "phase": [round(float(v), 5) for v in ph[keep]],
        "wave": [round(float(v), 5) for v in sig[:200]],
        "rec": [round(float(v), 5) for v in rec[:200]],
        "rec_nophase": [round(float(v), 5) for v in rec_nophase[:200]],
        "err": err, "err_nophase": err2,
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    print(f"采样率 {SR}，取 1 秒，信号 = 440 Hz 幅度 1.0 + 880 Hz 幅度 0.5\n")
    sig = make_signal()
    c = step1_one_coefficient(sig)
    step2_formula(sig)
    freqs, mag, ph = step3_magnitude_phase(sig)
    rec, err, rec_np, err2 = step4_roundtrip(sig, freqs, mag, ph)
    extra_real_audio()
    if "--dump" in sys.argv:
        dump_figures(sig, c, freqs, mag, ph, rec, err, rec_np, err2)

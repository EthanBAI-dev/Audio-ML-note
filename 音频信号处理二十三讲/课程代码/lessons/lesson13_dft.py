# -*- coding: utf-8 -*-
"""第 13 课 · 离散傅里叶变换。

跑法（在 project/ 目录下）：
    python lessons/lesson13_dft.py
    python lessons/lesson13_dft.py --dump

对应 source_course/13 - Discrete Fourier Transform/PDF。
PPT 的顺序是：数字信号 → 从积分到求和 → Hack 1 有限时间 →
Hack 2 有限频率 → DFT 频率格 → 冗余和奈奎斯特 → FFT。
"""
import os
import sys
from time import perf_counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab.figdata import dump


N = 8
SR = 8


def make_signal():
    """8 个样本：1 Hz 余弦，加上振幅 0.5 的 2 Hz 正弦。"""
    n = np.arange(N)
    x = np.cos(2 * np.pi * n / N) + 0.5 * np.sin(2 * np.pi * 2 * n / N)
    return n, x


def direct_dft(x):
    """按定义逐个频率格计算 DFT；不调用 np.fft。"""
    count = len(x)
    out = np.zeros(count, dtype=complex)
    for k in range(count):
        for n in range(count):
            out[k] += x[n] * np.exp(-2j * np.pi * k * n / count)
    return out


def direct_idft(X):
    """按定义把 N 个复数系数拼回 N 个样本。"""
    count = len(X)
    out = np.zeros(count, dtype=complex)
    for n in range(count):
        for k in range(count):
            out[n] += X[k] * np.exp(2j * np.pi * k * n / count)
    return out / count


def step1_finite_time(n, x):
    """PPT p5—19：g(t) 变成 x[n]，时间只保留 N 个位置。"""
    print("[正文] 第 1 步 · 时间上只保留 N 个样本")
    print(f"  N = {N}，采样率 = {SR} Hz")
    print("  样本编号 n：" + " ".join(str(int(v)) for v in n))
    print("  x[n]：")
    for start in range(0, len(x), 4):
        print("  " + " ".join(f"{v:+.4f}" for v in x[start:start + 4]))
    print("  连续时间 t 现在只能取 n / sr。")
    print("  积分也随之变成对这些样本求和。")
    print()


def step2_finite_frequencies(x):
    """PPT p20—32：只算 N 个频率，得到 N 个复数系数。"""
    print("[正文] 第 2 步 · 频率上只计算 N 个格子")
    X = direct_dft(x)
    X_np = np.fft.fft(x)
    err = float(np.max(np.abs(X - X_np)))
    print("  k 从 0 到 7；每个 k 得到一个复数。")
    for k, value in enumerate(X):
        print(f"  k={k}  X={value.real:+.4f}{value.imag:+.4f}i")
    print(f"  手写 DFT 与 np.fft.fft 最大差 {err:.3e}")
    print("  这一级误差只是浮点计算留下的尾数。")
    print()
    return X, err


def step3_invertible(X, x):
    """PPT p22：M=N 让一般的 N 点序列可以完整往返。"""
    print("[正文] 第 3 步 · 为什么频率格也取 N 个")
    ranks = {}
    for m in (4, 8):
        k = np.arange(m)[:, None]
        n = np.arange(N)[None, :]
        matrix = np.exp(-2j * np.pi * k * n / N)
        ranks[m] = int(np.linalg.matrix_rank(matrix))
        print(f"  M={m} 个频率格：矩阵秩 {ranks[m]}")
    rec = direct_idft(X)
    imag_tail = float(np.max(np.abs(rec.imag)))
    rec_err = float(np.max(np.abs(rec.real - x)))
    print(f"  用全部 {N} 个系数逆变换：")
    print(f"  实部逐点最大误差 {rec_err:.3e}")
    print(f"  虚部残留 {imag_tail:.3e}")
    print("  所以 N 个样本与 N 个复数系数能完整往返。")
    print("  真实序列还会出现镜像，下一步单独解释。")
    print()
    return rec.real, rec_err, imag_tail, ranks


def step4_frequency_grid(X):
    """PPT p28—37：k/N 换成 Hz，并看真实信号的镜像。"""
    print("[正文] 第 4 步 · 编号 k 怎样换成 Hz")
    raw_hz = np.arange(N) * SR / N
    signed_hz = np.where(np.arange(N) <= N // 2, raw_hz, raw_hz - SR)
    for k in range(N):
        print(f"  k={k}  频率={signed_hz[k]:+g} Hz")
    print(f"  k=N/2={N // 2} 对应 {SR / 2:g} Hz，")
    print("  它就是这个采样率下的奈奎斯特位置。")
    print()

    print("[正文] 第 5 步 · 真实信号的后一半是镜像")
    pair_errors = []
    for k in range(1, N // 2):
        error = float(abs(X[N - k] - np.conj(X[k])))
        pair_errors.append(error)
        print(f"  k={k} 与 k={N-k}：共轭误差 {error:.3e}")
    max_pair_error = max(pair_errors)
    print(f"  三组最大误差 {max_pair_error:.3e}")
    print("  所以真实录音只看 0 到奈奎斯特这一半，")
    print("  就没有丢掉另一半提供的新信息。")
    print()
    return raw_hz, signed_hz, max_pair_error


def matrix_dft(x):
    """向量化的直接 DFT，用于计时；运算量仍按 N² 增长。"""
    count = len(x)
    n = np.arange(count)
    kernel = np.exp(-2j * np.pi * n[:, None] * n[None, :] / count)
    return kernel @ x


def best_time_ms(fn, repeats):
    values = []
    for _ in range(repeats):
        start = perf_counter()
        fn()
        values.append((perf_counter() - start) * 1000)
    return min(values)


def average_time_ms(fn, repeats):
    start = perf_counter()
    for _ in range(repeats):
        fn()
    return (perf_counter() - start) * 1000 / repeats


def step5_fft_speed():
    """PPT p38：直接 DFT 是 N²；FFT 利用重复结构减少工作。"""
    print("[正文] 第 6 步 · DFT 与 FFT 的实测耗时")
    rng = np.random.default_rng(13)
    sizes = [64, 128, 256, 512]
    direct_ms = []
    fft_ms = []
    for size in sizes:
        x = rng.standard_normal(size)
        d_ms = best_time_ms(lambda: matrix_dft(x), 3)
        f_ms = average_time_ms(lambda: np.fft.fft(x), 1000)
        direct_ms.append(d_ms)
        fft_ms.append(f_ms)
        print(f"  N={size}: 直接 {d_ms:.3f} ms，FFT {f_ms:.4f} ms")
    ratio = direct_ms[-1] / fft_ms[-1]
    print(f"  N=512 时，当前机器上相差 {ratio:.0f} 倍。")
    print("  计时会随机器变化；增长趋势才是重点。")
    print()

    arbitrary = {}
    for size in (1000, 1024):
        x = rng.standard_normal(size)
        arbitrary[size] = average_time_ms(lambda: np.fft.fft(x), 1000)
    print("[脚本额外] 现代 FFT 不只接受 2 的幂")
    print(f"  N=1000 可以计算：{arbitrary[1000]:.4f} ms")
    print(f"  N=1024 可以计算：{arbitrary[1024]:.4f} ms")
    print("  2 的幂是经典 radix-2 FFT 的条件，")
    print("  不是 np.fft.fft 的输入限制。")
    print()
    return sizes, direct_ms, fft_ms, arbitrary


def dump_figures(n, x, X, rec, raw_hz, signed_hz, ranks,
                 dft_err, rec_err, imag_tail, pair_err,
                 sizes, direct_ms, fft_ms, arbitrary):
    path = dump(13, {
        "n": n,
        "x": x,
        "N": N,
        "sr": SR,
        "X_real": X.real,
        "X_imag": X.imag,
        "X_mag": np.abs(X),
        "reconstructed": rec,
        "dft_error": dft_err,
        "reconstruction_error": rec_err,
        "imaginary_tail": imag_tail,
        "pair_error": pair_err,
        "raw_hz": raw_hz,
        "signed_hz": signed_hz,
        "ranks": ranks,
        "sizes": sizes,
        "direct_ms": direct_ms,
        "fft_ms": fft_ms,
        "fft_arbitrary_ms": arbitrary,
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    n, x = make_signal()
    step1_finite_time(n, x)
    X, dft_err = step2_finite_frequencies(x)
    rec, rec_err, imag_tail, ranks = step3_invertible(X, x)
    raw_hz, signed_hz, pair_err = step4_frequency_grid(X)
    sizes, direct_ms, fft_ms, arbitrary = step5_fft_speed()

    assert dft_err < 1e-12
    assert rec_err < 1e-12
    assert imag_tail < 1e-12
    assert pair_err < 1e-12

    if "--dump" in sys.argv:
        dump_figures(n, x, X, rec, raw_hz, signed_hz, ranks,
                     dft_err, rec_err, imag_tail, pair_err,
                     sizes, direct_ms, fft_ms, arbitrary)

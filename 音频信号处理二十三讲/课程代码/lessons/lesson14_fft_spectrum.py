# -*- coding: utf-8 -*-
"""第 14 课 · 用 Python 提取真实声音的频谱。

跑法（在“课程代码”目录下）：
    python lessons/lesson14_fft_spectrum.py
    python lessons/lesson14_fft_spectrum.py --dump

对应 source_course/14 - Extracting the Discrete Fourier Transform/
Visualising the Power Spectrum.ipynb。
Notebook 的顺序是：定位四段声音 → 载入 → FFT → 取绝对值 →
只画低频 10% → 依次比较小提琴、钢琴、萨克斯和噪声。
"""
from math import gcd
import os
from pathlib import Path
import sys
import warnings

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

from soundlab.figdata import dump
from soundlab.spectral import pool_spectrum_max, relative_db, rfft_magnitude


TARGET_SR = 22050
F_RATIO = 0.1
VISIBLE_MAX_HZ = TARGET_SR * F_RATIO
PLOT_FLOOR_DB = -72.0
ROOT = Path(__file__).resolve().parents[3]
AUDIO_DIR = ROOT / "source_course" / "audio_resources"

SOUNDS = [
    ("violin", "小提琴 C4", "violin_c.wav"),
    ("piano", "钢琴 C5", "piano_c.wav"),
    ("sax", "萨克斯 C4", "sax.wav"),
    ("noise", "噪声", "noise.wav"),
]


def _to_float64(y):
    """把 WAV 的整数或浮点采样统一换成 -1 到 1 附近的 float64。"""
    if np.issubdtype(y.dtype, np.integer):
        info = np.iinfo(y.dtype)
        scale = max(abs(info.min), abs(info.max))
        return y.astype(np.float64) / scale
    return y.astype(np.float64)


def load_mono(path, target_sr=TARGET_SR):
    """复现 librosa.load 的核心约定：单声道，并统一到 22050 Hz。"""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        native_sr, y = wavfile.read(path)
    y = _to_float64(y)
    if y.ndim == 2:
        y = y.mean(axis=1)
    if native_sr != target_sr:
        common = gcd(int(native_sr), int(target_sr))
        y = resample_poly(y, target_sr // common, native_sr // common)
    return np.asarray(y, dtype=np.float64), int(native_sr)


def load_all():
    records = []
    for key, label, filename in SOUNDS:
        path = AUDIO_DIR / filename
        y, native_sr = load_mono(path)
        freqs, coefficients, magnitude = rfft_magnitude(y, TARGET_SR)
        visible_range = freqs <= VISIBLE_MAX_HZ
        db = relative_db(magnitude, reference_mask=visible_range)
        visible = (freqs >= 20.0) & (freqs <= VISIBLE_MAX_HZ)
        peak_index = int(np.flatnonzero(visible)[np.argmax(magnitude[visible])])
        plot_freqs, plot_db = pool_spectrum_max(
            freqs, db, VISIBLE_MAX_HZ, floor_value=PLOT_FLOOR_DB
        )
        records.append({
            "key": key,
            "label": label,
            "filename": filename,
            "native_sr": native_sr,
            "sr": TARGET_SR,
            "samples": len(y),
            "duration": len(y) / TARGET_SR,
            "y": y,
            "freqs": freqs,
            "coefficients": coefficients,
            "magnitude": magnitude,
            "relative_db": db,
            "peak_index": peak_index,
            "peak_hz": float(freqs[peak_index]),
            "peak_magnitude": float(magnitude[peak_index]),
            "plot_freqs": plot_freqs,
            "plot_db": plot_db,
        })
    return records


def print_source_experiment(records):
    print("[正文] 第 1 步 · 依次载入 Notebook 的四段声音")
    for r in records:
        print(
            f"  {r['label']}（{r['filename']}）：原始 {r['native_sr']} Hz，"
            f"统一后 {r['samples']} 个样本，{r['duration']:.3f} 秒"
        )
    print("  四段声音都已变成 22050 Hz 的单声道数字数组。")
    print()

    violin = records[0]
    y = violin["y"]
    X = np.fft.fft(y)
    print("[正文] 第 2 步 · 小提琴有多少个样本，FFT 就返回多少个系数")
    print(f"  输入样本数 N = {len(y)}")
    print(f"  len(np.fft.fft(y)) = {len(X)}")
    print(f"  len(np.fft.rfft(y)) = {len(np.fft.rfft(y))} = N // 2 + 1")
    print("  完整 FFT 保留正负频率；rfft 利用真实录音的镜像，只返回非负一半。")
    print()

    k = violin["peak_index"]
    value = violin["coefficients"][k]
    print("[正文] 第 3 步 · np.abs 把复数系数换成幅度")
    print(f"  小提琴可见范围最高峰位于 k = {k}")
    print(f"  X[k] = {value.real:+.3f}{value.imag:+.3f}i")
    print(f"  abs(X[k]) = {abs(value):.3f}")
    print(f"  配套频率轴给出 {violin['peak_hz']:.2f} Hz")
    print("  这串 abs(X) 按频率排开后就是本课画的幅度谱。")
    print()

    print("[正文] 第 4 步 · f_ratio=0.1 只改变显示范围")
    print(f"  完整 FFT 前 10% 对应约 0 到 {VISIBLE_MAX_HZ:.0f} Hz。")
    print("  高频系数仍然算过，只是这张图先不画出来。")
    print()

    print("[正文] 第 5 步 · 四段声音的低频幅度谱")
    for r in records:
        print(f"  {r['label']}：可见范围最高峰 {r['peak_hz']:.2f} Hz")
    print("  每张图把自己的可见范围最高峰设为 0 dB，只比较轮廓，不比较响度。")
    print()

    assert len(X) == len(y)
    assert len(np.fft.rfft(y)) == len(y) // 2 + 1
    assert all(r["sr"] == TARGET_SR for r in records)
    assert all(r["freqs"][-1] <= TARGET_SR / 2 for r in records)


def dump_figures(records):
    violin = records[0]
    path = dump(14, {
        "target_sr": TARGET_SR,
        "f_ratio": F_RATIO,
        "visible_max_hz": VISIBLE_MAX_HZ,
        "plot_floor_db": PLOT_FLOOR_DB,
        "violin_samples": violin["samples"],
        "violin_full_fft": violin["samples"],
        "violin_rfft": violin["samples"] // 2 + 1,
        "violin_peak_index": violin["peak_index"],
        "violin_peak_hz": violin["peak_hz"],
        "sounds": [{
            "key": r["key"],
            "label": r["label"],
            "filename": r["filename"],
            "native_sr": r["native_sr"],
            "samples": r["samples"],
            "duration": r["duration"],
            "peak_hz": r["peak_hz"],
            "plot_freqs": r["plot_freqs"],
            "plot_db": r["plot_db"],
        } for r in records],
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    data = load_all()
    print_source_experiment(data)
    if "--dump" in sys.argv:
        dump_figures(data)

# -*- coding: utf-8 -*-
"""第 22 课 · 从头实现带能量比，并检查频率轴是否切对。

跑法（在 ``音频信号处理二十三讲/课程代码`` 目录下）：
    python lessons/lesson22_band_energy_ratio.py
    python lessons/lesson22_band_energy_ratio.py --dump
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np

from soundlab import io
from soundlab.figdata import dump
from soundlab.frequency_features import (
    band_energy_ratio,
    ratio_to_db,
    rfft_frequencies,
    split_frequency_bin,
)

FRAME_SIZE = 2048
HOP_SIZE = 512
SPLIT_HZ = 2000.0
SECONDS = 30.0
GENRES = ("debussy", "redhot", "duke")


def source_bin_approx(split_frequency, sample_rate, num_frequency_bins):
    """课程源代码里的近似写法；保留用于复现差异。"""
    frequency_range = sample_rate / 2
    frequency_delta_per_bin = frequency_range / num_frequency_bins
    return math.floor(split_frequency / frequency_delta_per_bin)


def explicit_loop(power, split):
    """把每一帧摊开写，作为向量化求和的独立对照。"""
    out = np.empty(power.shape[1], dtype=float)
    for frame in range(power.shape[1]):
        low = sum(float(v) for v in power[:split, frame])
        high = sum(float(v) for v in power[split:, frame])
        out[frame] = low / high if high > 0 else np.inf
    return out


def stats(values):
    q25, median, q75 = np.nanpercentile(values, [25, 50, 75])
    return {"q25": float(q25), "median": float(median), "q75": float(q75)}


def pool(values, n=360):
    values = np.asarray(values, dtype=float)
    edges = np.linspace(0, len(values), min(n, len(values)) + 1).astype(int)
    return np.array([values[a:max(b, a + 1)].mean()
                     for a, b in zip(edges[:-1], edges[1:])])


def main():
    print(f"采样率 22050 Hz，帧长 {FRAME_SIZE}，帧移 {HOP_SIZE}，"
          f"分界 {SPLIT_HZ:.0f} Hz\n")
    signals, spectra = {}, {}
    print("[正文] 第 1 步 · 载入三段音乐并做 STFT")
    for name in GENRES:
        y, sr = io.load(name, seconds=SECONDS)
        S = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
        signals[name], spectra[name] = (y, sr), S
        print(f"  {name:<8} {len(y)} 个样本 -> {S.shape}")
    sr = signals[GENRES[0]][1]
    print("  1025 行是频率格，1292 列是时间帧。\n")

    print("[正文] 第 2 步 · 2000 Hz 到底是哪一格")
    frequencies = rfft_frequencies(sr, FRAME_SIZE)
    direct = source_bin_approx(SPLIT_HZ, sr, len(frequencies))
    correct = split_frequency_bin(sr, FRAME_SIZE, SPLIT_HZ)
    wrong_axis = source_bin_approx(SPLIT_HZ, sr, len(spectra[GENRES[0]][0]))
    print(f"  用 Nyquist / 1025 近似格距：第 {direct} 格，实际 {frequencies[direct]:.2f} Hz")
    print(f"  在真实频率轴找第一个 >= 2000 Hz：第 {correct} 格，"
          f"实际 {frequencies[correct]:.2f} Hz")
    print(f"  若把 1292 个时间帧误当成频率格：第 {wrong_axis} 格，"
          f"实际 {frequencies[wrong_axis]:.2f} Hz")
    print(f"  本课约定：低侧是 0—{frequencies[correct - 1]:.2f} Hz，"
          f"高侧从 {frequencies[correct]:.2f} Hz 开始。\n")

    print("[正文] 第 3 步 · 沿频率轴逐帧求 BER")
    tracks, summaries, bug_summaries = {}, {}, {}
    max_loop_diff = 0.0
    for name in GENRES:
        S = spectra[name]
        ratio, low, high, split = band_energy_ratio(
            S, sr, FRAME_SIZE, SPLIT_HZ)
        power = np.abs(S) ** 2
        loop = explicit_loop(power, split)
        max_loop_diff = max(max_loop_diff, float(np.max(np.abs(loop - ratio))))
        db = ratio_to_db(low, high)
        wrong_low = power[:wrong_axis].sum(axis=0)
        wrong_high = power[wrong_axis:].sum(axis=0)
        wrong_db = ratio_to_db(wrong_low, wrong_high)
        tracks[name] = db
        summaries[name] = stats(db)
        bug_summaries[name] = stats(wrong_db)
        s = summaries[name]
        print(f"  {name:<8} 中位 {s['median']:>7.2f} dB，"
              f"中间一半 {s['q25']:>7.2f}—{s['q75']:.2f} dB")
    print(f"  向量化求和与显式逐帧循环的最大差：{max_loop_diff:.3e}\n")

    print("[正文] 第 4 步 · 写错轴会改变多少")
    for name in GENRES:
        fixed = summaries[name]["median"]
        wrong = bug_summaries[name]["median"]
        print(f"  {name:<8} 正确 {fixed:>7.2f} dB；错误分界 {wrong:>7.2f} dB；"
              f"相差 {wrong - fixed:+.2f} dB")

    print("\n[脚本额外] 分界频率不是常数答案")
    threshold_rows = []
    for split_hz in (500.0, 1000.0, 2000.0, 4000.0):
        row = {"split_hz": split_hz, "median": {}}
        for name in GENRES:
            _, low, high, _ = band_energy_ratio(
                spectra[name], sr, FRAME_SIZE, split_hz)
            row["median"][name] = float(np.nanmedian(ratio_to_db(low, high)))
        threshold_rows.append(row)
        values = "  ".join(f"{g} {row['median'][g]:6.2f} dB" for g in GENRES)
        print(f"  {split_hz:>4.0f} Hz：{values}")

    if "--dump" in sys.argv:
        duration = spectra[GENRES[0]].shape[1] * HOP_SIZE / sr
        payload = {
            "sr": sr,
            "n_fft": FRAME_SIZE,
            "hop": HOP_SIZE,
            "seconds": SECONDS,
            "shape": list(spectra[GENRES[0]].shape),
            "split_hz": SPLIT_HZ,
            "bins": {
                "source_approx": direct,
                "correct": correct,
                "wrong_axis": wrong_axis,
                "source_hz": frequencies[direct],
                "correct_hz": frequencies[correct],
                "wrong_axis_hz": frequencies[wrong_axis],
                "low_last_hz": frequencies[correct - 1],
            },
            "max_loop_diff": max_loop_diff,
            "summaries": summaries,
            "bug_summaries": bug_summaries,
            "thresholds": threshold_rows,
            "tracks": {
                "duration": duration,
                "names": list(GENRES),
                "values": {name: pool(tracks[name]) for name in GENRES},
            },
        }
        print(f"\n[配图数据] 写好了 {dump(22, payload)}")


if __name__ == "__main__":
    main()

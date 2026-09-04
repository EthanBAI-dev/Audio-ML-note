# -*- coding: utf-8 -*-
"""第 23 课 · 手写频谱质心和带宽，并与 librosa 逐帧对齐。

跑法（在 ``音频信号处理二十三讲/课程代码`` 目录下）：
    python lessons/lesson23_centroid_bandwidth.py
    python lessons/lesson23_centroid_bandwidth.py --dump
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np

from soundlab import io
from soundlab.figdata import dump
from soundlab.frequency_features import (
    rfft_frequencies,
    spectral_bandwidth,
    spectral_centroid,
)

FRAME_SIZE = 1024
HOP_SIZE = 512
SECONDS = 30.0
GENRES = ("debussy", "redhot", "duke")


def stats(values):
    q25, median, q75 = np.percentile(values, [25, 50, 75])
    return {"q25": float(q25), "median": float(median), "q75": float(q75)}


def pool(values, n=360):
    values = np.asarray(values, dtype=float)
    edges = np.linspace(0, len(values), min(n, len(values)) + 1).astype(int)
    return np.array([values[a:max(b, a + 1)].mean()
                     for a, b in zip(edges[:-1], edges[1:])])


def main():
    print(f"采样率 22050 Hz，帧长 {FRAME_SIZE}，帧移 {HOP_SIZE}\n")
    frequencies = rfft_frequencies(22050, FRAME_SIZE)
    rows, tracks = {}, {}
    global_centroid_diff = 0.0
    global_bandwidth_diff = 0.0

    print("[正文] 第 1 步 · 三段音乐各得到一条质心和一条带宽轨迹")
    for name in GENRES:
        y, sr = io.load(name, seconds=SECONDS)
        S = np.abs(librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE))
        lib_centroid = librosa.feature.spectral_centroid(
            S=S, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)[0]
        lib_bw2 = librosa.feature.spectral_bandwidth(
            S=S, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_SIZE,
            centroid=lib_centroid[None, :], p=2, norm=True)[0]

        mine_centroid = spectral_centroid(S, frequencies)
        mine_bw1 = spectral_bandwidth(S, frequencies, mine_centroid, p=1)
        mine_bw2 = spectral_bandwidth(S, frequencies, mine_centroid, p=2)
        centroid_diff = float(np.max(np.abs(mine_centroid - lib_centroid)))
        bandwidth_diff = float(np.max(np.abs(mine_bw2 - lib_bw2)))
        global_centroid_diff = max(global_centroid_diff, centroid_diff)
        global_bandwidth_diff = max(global_bandwidth_diff, bandwidth_diff)
        corr = float(np.corrcoef(mine_centroid, mine_bw2)[0, 1])

        rows[name] = {
            "shape": list(lib_centroid.shape),
            "centroid": stats(mine_centroid),
            "bandwidth_p1": stats(mine_bw1),
            "bandwidth_p2": stats(mine_bw2),
            "p2_over_p1_median": float(np.median(mine_bw2) / np.median(mine_bw1)),
            "corr": corr,
            "centroid_diff": centroid_diff,
            "bandwidth_diff": bandwidth_diff,
        }
        tracks[name] = {
            "centroid": pool(mine_centroid),
            "bandwidth_p1": pool(mine_bw1),
            "bandwidth_p2": pool(mine_bw2),
        }
        c, b = rows[name]["centroid"], rows[name]["bandwidth_p2"]
        print(f"  {name:<8} shape {tuple(lib_centroid.shape)}；质心中位 {c['median']:.1f} Hz；"
              f"p=2 带宽中位 {b['median']:.1f} Hz")

    print("\n[正文] 第 2 步 · 手写结果与库函数逐帧核对")
    print(f"  三段里质心最大绝对差：{global_centroid_diff:.3e} Hz")
    print(f"  三段里 p=2 带宽最大绝对差：{global_bandwidth_diff:.3e} Hz")
    print("  差值只剩浮点运算顺序；公式、权重、频率轴和矩阵方向已经一致。")

    print("\n[正文] 第 3 步 · p=1 和 p=2 不是同一个带宽")
    for name in GENRES:
        p1 = rows[name]["bandwidth_p1"]["median"]
        p2 = rows[name]["bandwidth_p2"]["median"]
        print(f"  {name:<8} p=1 中位 {p1:7.1f} Hz；p=2 中位 {p2:7.1f} Hz；"
              f"后者是前者 {p2 / p1:.2f} 倍")

    print("\n[正文] 第 4 步 · 这三段录音实际怎样")
    print("  录音      质心中间一半/Hz       p=2带宽中间一半/Hz    两轨迹相关")
    for name in GENRES:
        c = rows[name]["centroid"]
        b = rows[name]["bandwidth_p2"]
        print(f"  {name:<8}{c['q25']:7.0f}—{c['q75']:<7.0f}"
              f"{b['q25']:10.0f}—{b['q75']:<7.0f}{rows[name]['corr']:>11.3f}")
    print("  这些数字只描述课程里的三段录音；每类只有一首，不能据此宣布整个流派的规律。")

    if "--dump" in sys.argv:
        frames = len(next(iter(tracks.values()))["centroid"])
        full_frames = rows[GENRES[0]]["shape"][0]
        payload = {
            "sr": 22050,
            "n_fft": FRAME_SIZE,
            "hop": HOP_SIZE,
            "seconds": SECONDS,
            "full_frames": full_frames,
            "pooled_frames": frames,
            "duration": full_frames * HOP_SIZE / 22050,
            "names": list(GENRES),
            "rows": rows,
            "max_diff": {
                "centroid": global_centroid_diff,
                "bandwidth_p2": global_bandwidth_diff,
            },
            "tracks": tracks,
        }
        print(f"\n[配图数据] 写好了 {dump(23, payload)}")


if __name__ == "__main__":
    main()

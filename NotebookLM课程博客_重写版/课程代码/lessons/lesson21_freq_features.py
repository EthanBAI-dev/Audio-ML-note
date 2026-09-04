# -*- coding: utf-8 -*-
"""第 21 课 · 用三个数回答一列频谱里的三个不同问题。

跑法（在 ``NotebookLM课程博客_重写版/课程代码`` 目录下）：
    python lessons/lesson21_freq_features.py
    python lessons/lesson21_freq_features.py --dump

本课只用已知答案的合成频谱建立概念边界。真实音乐的 BER 留给第 22 课，
质心与带宽留给第 23 课，避免三课重复同一个实验。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab.figdata import dump
from soundlab.frequency_features import (
    band_energy_ratio_from_power,
    spectral_bandwidth,
    spectral_centroid,
)

FREQUENCIES = np.arange(0.0, 3000.1, 500.0)
SPLIT_HZ = 1200.0
SPECTRA = {
    # 前三条组成两组受控对照：窄与宽的质心都是 1000 Hz；宽与平移后的
    # 带宽都是 500 Hz。折线只是把离散频率格连起来，不冒充连续测量。
    "窄而居中": np.array([0, 1, 4, 1, 0, 0, 0], dtype=float),
    "宽而居中": np.array([0, 2, 0, 2, 0, 0, 0], dtype=float),
    "同宽但右移": np.array([0, 0, 0, 2, 0, 2, 0], dtype=float),
}


def measure(name, magnitude):
    M = magnitude[:, None]
    power = M ** 2
    ber, low, high, split = band_energy_ratio_from_power(
        power, FREQUENCIES, SPLIT_HZ)
    centroid = spectral_centroid(M, FREQUENCIES)
    bw1 = spectral_bandwidth(M, FREQUENCIES, centroid, p=1)
    bw2 = spectral_bandwidth(M, FREQUENCIES, centroid, p=2)
    return {
        "name": name,
        "magnitude": magnitude,
        "split_bin": split,
        "low_power": float(low[0]),
        "high_power": float(high[0]),
        "ber": float(ber[0]),
        "centroid": float(centroid[0]),
        "bandwidth_p1": float(bw1[0]),
        "bandwidth_p2": float(bw2[0]),
    }


def main():
    print("[正文] 一列频谱，压成三个回答不同问题的数\n")
    rows = [measure(name, mag) for name, mag in SPECTRA.items()]

    print(f"  频率格：{FREQUENCIES.astype(int).tolist()} Hz")
    print(f"  分界频率：{SPLIT_HZ:.0f} Hz；低侧 < {SPLIT_HZ:.0f}，"
          f"高侧 >= {SPLIT_HZ:.0f}\n")
    print("  频谱          低侧功率  高侧功率   BER   质心/Hz  p=1带宽  p=2带宽")
    for r in rows:
        print(f"  {r['name']:<12}{r['low_power']:>8.1f}{r['high_power']:>10.1f}"
              f"{r['ber']:>7.2f}{r['centroid']:>10.1f}"
              f"{r['bandwidth_p1']:>10.1f}{r['bandwidth_p2']:>10.1f}")

    a, b, c = rows
    print("\n[正文] 两组受控对照")
    print(f"  『{a['name']}』和『{b['name']}』质心都在 {a['centroid']:.0f} Hz，"
          f"但 p=2 带宽是 {a['bandwidth_p2']:.1f} 与 {b['bandwidth_p2']:.1f} Hz。")
    print(f"  『{b['name']}』和『{c['name']}』p=2 带宽都为 "
          f"{b['bandwidth_p2']:.0f} Hz，但质心是 {b['centroid']:.0f} 与 "
          f"{c['centroid']:.0f} Hz。")
    print("  所以中心和展开不是一回事；BER 又问分界线两边的功率比例，三者不能互换。")

    print("\n[正文] p=1 与 p=2 是两把不同的宽度尺")
    print(f"  对『{a['name']}』，平均绝对距离是 {a['bandwidth_p1']:.1f} Hz，"
          f"均方根距离是 {a['bandwidth_p2']:.1f} Hz。")
    print("  第 23 课会用 p=2 对齐 librosa 的默认值；看到带宽数值时必须先问 p 是多少。")

    if "--dump" in sys.argv:
        payload = {
            "frequencies": FREQUENCIES,
            "split_hz": SPLIT_HZ,
            "rows": rows,
        }
        print(f"\n[配图数据] 写好了 {dump(21, payload)}")


if __name__ == "__main__":
    main()

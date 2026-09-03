# -*- coding: utf-8 -*-
"""第 01 课 · 电脑读一段录音的三种方式：波形、频谱、声谱图。

跑法（在 project/ 目录下）：
    python lessons/lesson01_three_views.py

实验的问题只有一个：同一声敲击，用整段频谱去读和用声谱图去读，各能读出多少？
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

from soundlab import io
from soundlab.config import SR

N_FFT, HOP = 1024, 256


def make_hum_and_knock(sr=SR, seconds=3.0, knock_at=1.5, seed=0):
    """造一段「持续嗡嗡声 + 一下 30 毫秒的敲击」。

    自己造而不是从录音里截，是因为要让「有没有那一下」成为两段声音之间
    唯一的差别。真实录音做不到这一点，量出来的差就说不清是谁造成的。
    """
    rng = np.random.default_rng(seed)
    t = np.arange(int(seconds * sr)) / sr
    hum = 0.3 * np.sin(2 * np.pi * 220 * t) + 0.15 * np.sin(2 * np.pi * 440 * t)
    knock = np.zeros_like(hum)
    k0, n = int(knock_at * sr), int(0.03 * sr)
    knock[k0:k0 + n] = rng.standard_normal(n) * 0.9 * np.exp(-np.arange(n) / 120)
    return hum, hum + knock


def step1_2_spectrum(hum, mix):
    print("[正文] 第 1、2 步 · 整段频谱看得见那一下敲击吗")
    Smix = np.abs(np.fft.rfft(mix))
    Shum = np.abs(np.fft.rfft(hum))
    diff = np.max(np.abs(Smix - Shum)) / Smix.max() * 100
    print(f"  整段 3 秒做一次频率统计，敲击只占 30 毫秒，是全长的 1%")
    print(f"  加了敲击之后，整段频谱最多变了 {diff:.2f} %")
    print(f"  这个变化量比大多数录音的噪声起伏还小，程序不可能靠它把敲击认出来。")
    print()


def step3_spectrogram(mix, knock_at=1.5):
    print("[正文] 第 3 步 · 换成声谱图再看一次")
    Sg = np.abs(librosa.stft(mix, n_fft=N_FFT, hop_length=HOP))
    col = int(knock_at * SR / HOP)
    ratio = float(Sg[:, col].sum() / Sg[:, col - 8].sum())
    print(f"  声谱图形状 {Sg.shape}：{Sg.shape[0]} 个频率位置 × {Sg.shape[1]} 列")
    print(f"  每列覆盖 {HOP / SR * 1000:.1f} 毫秒，敲击落在第 {col} 列")
    print(f"  敲击那一列 / 之前 8 列（{8 * HOP / SR * 1000:.0f} 毫秒前）= {ratio:.1f} 倍")
    print("  同一段声音、同一个事件：换一种读取方式，就从「查不出来」变成「一眼看见」。")
    print()


def level_shapes():
    print("[正文] 加一层 · 三段音乐用同一组参数，形状必须一样")
    for name in ["debussy", "duke", "redhot"]:
        y, _ = io.load(name, seconds=10)
        S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
        print(f"  {name:8} {S.shape}")
    print("  参数一样，形状就一样——这是后面能把它们放进同一张表的前提。")
    print()


def extra_three_views_numbers():
    """正文没放：三种读取方式各自产出多少个数。"""
    print("[脚本额外] 同一段 10 秒录音，三种读取方式各产出多少个数")
    y, _ = io.load("debussy", seconds=10)
    wave = len(y)
    spec = len(np.fft.rfft(y))
    sg = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    print(f"  {'读取方式':<10}{'产出多少个数':>14}{'保留时间位置':>14}")
    print(f"  {'波形':<10}{wave:>14}{'是':>14}")
    print(f"  {'整段频谱':<10}{spec:>14}{'否':>14}")
    print(f"  {'声谱图':<10}{sg.size:>14}{'是（精确到列）':>14}")
    print(f"  声谱图是 {sg.shape[0]} × {sg.shape[1]}，比波形还多——它把一条线摊成了一张图。")
    print("  「数更多」不等于「信息更多」：声谱图里的数由波形算出来，没有凭空多出信息，")
    print("  但它把「第几秒有哪些成分」摆成了程序一眼能查的形状。")
    print()


def extra_knock_position():
    """正文没放：声谱图能把敲击定位到多准。"""
    print("[脚本额外] 声谱图能把那一下敲击定位到多准")
    hum, mix = make_hum_and_knock()
    Sg = np.abs(librosa.stft(mix, n_fft=N_FFT, hop_length=HOP))
    energy = Sg.sum(axis=0)
    col = int(np.argmax(energy))
    t = col * HOP / SR
    print(f"  能量最高的一列是第 {col} 列，对应 {t:.4f} 秒")
    print(f"  敲击真实位置 1.5000 秒，差 {abs(t - 1.5) * 1000:.1f} 毫秒")
    print(f"  这个误差不会小于一列的宽度 {HOP / SR * 1000:.1f} 毫秒——列越窄定位越准，")
    print("  但每列覆盖的时间变短，能分辨的频率就变粗。第 15 课会正面处理这条取舍。")
    print()


if __name__ == "__main__":
    hum, mix = make_hum_and_knock()
    step1_2_spectrum(hum, mix)
    step3_spectrogram(mix)
    level_shapes()
    extra_three_views_numbers()
    extra_knock_position()

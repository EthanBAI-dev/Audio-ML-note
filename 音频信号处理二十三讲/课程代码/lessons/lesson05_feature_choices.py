# -*- coding: utf-8 -*-
"""第 05 课 · 该从录音里算出什么交给模型：四个问题。

跑法（在 project/ 目录下）：
    python lessons/lesson05_feature_choices.py

核心实验只有六个数：把顺序完全打乱，均值和标准差一位小数都不变。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

from soundlab import io

SR = 16000


def step1_3_order_lost():
    print("[正文] 第 1—3 步 · 打乱顺序，统计量一点不变")
    z = [0.1, 0.2, 0.9, 0.4, 0.8, 0.1]
    print(f"  原序 {z}")
    print(f"    均值 = {np.mean(z):.4f}   标准差 = {np.std(z):.4f}")
    print(f"  倒序 {z[::-1]}")
    print(f"    均值 = {np.mean(z[::-1]):.4f}   标准差 = {np.std(z[::-1]):.4f}")
    rng = np.random.default_rng(0)
    sh = [float(v) for v in rng.permutation(z)]
    print(f"  随机打乱 {[round(v, 1) for v in sh]}")
    print(f"    均值 = {np.mean(sh):.4f}   标准差 = {np.std(sh):.4f}")
    print("  三行完全相同。这不是巧合：均值和标准差的定义里都是求和，加法不在乎顺序。")
    print("  推广一下：任何与顺序无关的统计量，都无法还原峰值出现在第几段——")
    print("  换成最大值、中位数、分位数，结论一样。")
    print()


def level_two_shapes():
    print("[正文] 加一层 · 同一份数据，两种形状")
    y, sr = io.load("debussy", sr=SR, seconds=5)
    mel_power = librosa.feature.melspectrogram(
        y=y, sr=sr, n_fft=1024, hop_length=160, n_mels=64, power=2.0)
    log_mel = librosa.power_to_db(mel_power, ref=1.0, top_db=80)
    frame_sequence = log_mel.T
    global_vector = np.r_[log_mel.mean(axis=1), log_mel.std(axis=1)]
    print(f"  log_mel        {log_mel.shape}   64 个频带 × {log_mel.shape[1]} 个时间帧")
    print(f"  保留时间       {frame_sequence.shape}   每个时刻一个 64 维向量")
    print(f"  丢掉时间       {global_vector.shape}   64 个均值 + 64 个标准差")
    print("  第二种长度固定，和录音多长无关，适合做第一版对照方案；")
    print("  但「峰出现在第几帧」再也问不出来了。")
    print()
    return mel_power


def level_ref(mel_power):
    print("[正文] 加一层 · ref 换一个值，同一段录音算出来的数就不一样")
    lm_fixed = librosa.power_to_db(mel_power, ref=1.0, top_db=80)
    lm_self = librosa.power_to_db(mel_power, ref=np.max, top_db=80)
    print(f"  ref=1.0   最大 = {lm_fixed.max():.2f}   最小 = {lm_fixed.min():.2f}")
    print(f"  ref=max   最大 = {lm_self.max():.2f}   最小 = {lm_self.min():.2f}")
    print("  ref=1.0 用固定参考，不同录音之间的绝对电平差被保留下来。")
    print("  ref=np.max 让每段以自身峰值为 0 dB，便于比较分布形状，")
    print("  但会抹掉录音之间的电平差——而且不会报错。")
    print()


def extra_ref_across_files():
    """正文没放：ref=np.max 到底删掉了什么，用三段音乐量一次。"""
    print("[脚本额外] 三段音乐用两种 ref，各自的最大值")
    print(f"  {'':10}{'ref=1.0 最大':>16}{'ref=max 最大':>16}")
    for nm, zh in [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚")]:
        y, sr = io.load(nm, sr=SR, seconds=5)
        mp = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=1024,
                                            hop_length=160, n_mels=64, power=2.0)
        a = librosa.power_to_db(mp, ref=1.0, top_db=80).max()
        b = librosa.power_to_db(mp, ref=np.max, top_db=80).max()
        print(f"  {zh:10}{a:16.2f}{b:16.2f}")
    print("  右边一列三个都是 0.00——每段各自以自己为准，三段之间的电平差没了。")
    print("  左边一列还留着差别。任务如果依赖「这台机器比以前更吵了」，")
    print("  用 ref=np.max 就把关键线索删掉了。")
    print()


def extra_four_questions():
    """正文没放：把四个问题套到本课程的项目上，写成一张表。"""
    print("[脚本额外] 四个问题套到《三首曲子，一个分类器》上")
    rows = [
        ("拆成什么", "高频占比 / 节奏密度 / 力度起伏"),
        ("看多长", "节奏和力度是随时间的事，先留序列，最后一步才聚合"),
        ("哪个角度", "高频占比看成分，节奏看时间，力度起伏两边都要"),
        ("谁来算", "只有几十个片段，用规则算出的特征做基线"),
    ]
    for q, a in rows:
        print(f"  {q:<10}{a}")
    print("  答案是四个问题共同决定的，不是从清单上挑一个名词。")
    print()


if __name__ == "__main__":
    step1_3_order_lost()
    mp = level_two_shapes()
    level_ref(mp)
    extra_ref_across_files()
    extra_four_questions()

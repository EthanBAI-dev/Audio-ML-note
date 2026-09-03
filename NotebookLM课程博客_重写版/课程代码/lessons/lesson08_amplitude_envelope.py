# -*- coding: utf-8 -*-
"""第 08 课 · 把「每帧取最大值」写成一个不会算错的函数。

跑法（在 project/ 目录下）：
    python lessons/lesson08_amplitude_envelope.py

带 [正文] 的段落是文章里出现过的，其余是脚本额外做的检查。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.config import SR, FRAME_LENGTH, HOP_LENGTH
from soundlab.framing import frame, n_frames, tail_samples, frame_times
from soundlab.time_features import amplitude_envelope


def step1_absolute_first():
    print("[正文] 第 1 步 · 四个数，先取绝对值和不取绝对值差 0.2")
    four = np.array([-0.2, 0.7, -0.9, 0.4])
    print(f"  四个数        {four.tolist()}")
    print(f"  直接取最大值   {four.max():.1f}   ← 漏掉了向下的那个峰")
    print(f"  先取绝对值     {np.abs(four).max():.1f}   ← 离中线最远的确实是 -0.9")
    print(f"  差 {np.abs(four).max() - four.max():.1f}，占正确答案的 "
          f"{(np.abs(four).max() - four.max()) / np.abs(four).max():.0%}")
    print()


def step2_real_envelope():
    print("[正文] 第 2 步 · 真实录音上跑一遍，核对帧数和被丢掉的尾巴")
    y, _ = io.load("debussy", seconds=3)
    f = frame(y, FRAME_LENGTH, HOP_LENGTH)
    env = amplitude_envelope(f)
    left = tail_samples(len(y), FRAME_LENGTH, HOP_LENGTH)
    print(f"  样本数 {len(y)}，帧长 {FRAME_LENGTH}，帧移 {HOP_LENGTH}")
    print(f"  手算帧数 1 + ({len(y)} - {FRAME_LENGTH}) // {HOP_LENGTH} = "
          f"{n_frames(len(y), FRAME_LENGTH, HOP_LENGTH)}")
    print(f"  代码给出 {env.shape[0]} 帧，包络最大值 {env.max():.4f}")
    print(f"  用掉 {len(y) - left} 个样本，剩下 {left} 个没进任何一帧 "
          f"= {left / SR * 1000:.2f} 毫秒")
    print()
    return y, env


def step3_time_axis(y, env):
    print("[正文] 第 3 步 · 每个点标在帧起点还是帧中心")
    m = len(env)
    t_start = frame_times(m, HOP_LENGTH, FRAME_LENGTH, SR, where="start")
    t_center = frame_times(m, HOP_LENGTH, FRAME_LENGTH, SR, where="center")
    shift = FRAME_LENGTH / 2 / SR * 1000
    print(f"  第 0 帧：起点标在 {t_start[0]:.4f} 秒，中心标在 {t_center[0]:.4f} 秒")
    print(f"  两种标法整条差 {shift:.2f} 毫秒，永远是半个帧长")

    # 对齐检查：包络最高的那一帧，和波形最高的那个样本，应该落在同一个位置附近
    peak_sample = int(np.argmax(np.abs(y)))
    peak_time = peak_sample / SR
    k = int(np.argmax(env))
    print(f"  波形最高的样本在 {peak_time:.4f} 秒")
    print(f"  包络最高的那一帧：按起点标 {t_start[k]:.4f} 秒，"
          f"按中心标 {t_center[k]:.4f} 秒")
    print(f"  按起点差 {abs(t_start[k] - peak_time) * 1000:.1f} 毫秒，"
          f"按中心差 {abs(t_center[k] - peak_time) * 1000:.1f} 毫秒")
    print()


def two_hits(gap_ms=30, sr=SR):
    """两下敲击，间隔已知。用它来量「多长的帧会把两下并成一下」。

    直接拿音乐去比帧长证明不了什么——三条包络的峰值和起伏几乎一样。
    造两个间隔已知的脉冲，才能给出一个能验收的答案。
    """
    y = np.zeros(sr // 2)
    for h in (sr // 8, sr // 8 + int(sr * gap_ms / 1000)):
        dec = np.exp(-np.arange(600) / 120.0)
        y[h:h + 600] += dec * np.sin(2 * np.pi * 900 * np.arange(600) / sr)
    return y


def count_peaks(v, rel=0.25):
    """数出比左右邻居都高、并且高过全曲峰值 rel 倍的点。"""
    thr = v.max() * rel
    return int(sum(1 for i in range(1, len(v) - 1)
                   if v[i] > thr and v[i] >= v[i - 1] and v[i] > v[i + 1]))


def level_frame_length():
    print("[正文] 加一层 · 两下敲击相隔 30 毫秒，多长的帧会把它们并成一下")
    y = two_hits(30)
    print(f"  {'帧长':>6}{'覆盖时间':>10}{'帧数':>7}{'数出几个峰':>12}")
    for n in (256, 1024, 4096):
        env = amplitude_envelope(frame(y, n, n // 2))
        print(f"  {n:6d}{n / SR * 1000:9.1f}ms{len(env):7d}{count_peaks(env):12d}")
    print("  帧长 256（11.6 毫秒）比敲击间隔短，两下分得开；")
    print("  1024（46.4 毫秒）已经比间隔长，两下落进同一帧，只剩一个峰。")
    print("  结论：帧长必须短于你想分开的两个事件之间的间隔。")
    print()


def level_tail_policy():
    print("[正文] 加一层 · 结尾不足一帧的那一小截，三种处理各得到多少帧")
    y, _ = io.load("debussy", seconds=3)
    L = len(y)
    drop = n_frames(L, FRAME_LENGTH, HOP_LENGTH)
    starts = list(range(0, L, HOP_LENGTH))
    lens = [min(st + FRAME_LENGTH, L) - st for st in starts]
    short = [n for n in lens if n < FRAME_LENGTH]
    padded = np.pad(y, (0, (-(L - FRAME_LENGTH)) % HOP_LENGTH))
    pad = n_frames(len(padded), FRAME_LENGTH, HOP_LENGTH)
    print(f"  丢掉尾巴      {drop} 帧，最后 {tail_samples(L)} 个样本没用上")
    print(f"  保留短尾帧    {len(starts)} 帧，其中 {len(short)} 帧不满一帧，"
          f"长度分别是 {short}")
    print(f"  补零到整帧    {pad} 帧，补进去 {len(padded) - L} 个零")
    print("  三种都对，但整个数据集必须用同一种，而且要写进配置。")
    print()


def level_librosa_center():
    print("[正文] 加一层 · 和 librosa 对齐：center=True 会多出两帧")
    import librosa
    y, _ = io.load("debussy", seconds=3)
    ours = n_frames(len(y), FRAME_LENGTH, HOP_LENGTH)
    lib_false = librosa.util.frame(y, frame_length=FRAME_LENGTH,
                                   hop_length=HOP_LENGTH).shape[1]
    padded = np.pad(y, FRAME_LENGTH // 2, mode="constant")
    lib_true = librosa.util.frame(padded, frame_length=FRAME_LENGTH,
                                  hop_length=HOP_LENGTH).shape[1]
    print(f"  我们的 frame()            {ours} 帧")
    print(f"  librosa center=False      {lib_false} 帧")
    print(f"  librosa center=True       {lib_true} 帧（两头各补了 "
          f"{FRAME_LENGTH // 2} 个零）")
    print("  差的这两帧不是 bug：center=True 让第 0 帧的中心落在 0 秒，")
    print("  代价是开头和结尾各多出半帧凭空补的零。两批特征混用会整体错半帧。")
    print()


def extra_three_music():
    """正文没放：三段音乐的包络，归一化前后能比较的东西不一样。"""
    print("[脚本额外] 三段音乐的振幅包络，各自归一化之后还能比什么")
    print(f"  {'':10}{'峰值':>9}{'包络平均':>11}{'平均/峰值':>12}")
    for nm, zh in [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚")]:
        y, _ = io.load(nm, seconds=10)
        env = amplitude_envelope(frame(y))
        peak = float(np.abs(y).max())
        print(f"  {zh:10}{peak:9.4f}{env.mean():11.4f}{env.mean() / peak:12.4f}")
    print("  各自除以自己的峰值之后，「谁录得响」就没了，剩下的是轮廓的形状：")
    print("  最后一列是包络平均值占自身峰值的比例。古典 0.60 最高，说明它整段")
    print("  都在同一个强度附近；爵士 0.40 最低，说明它忽强忽弱的落差最大。")
    print()


def extra_speed():
    """正文没放：三种写法各要多久。结论和想当然的不一样。"""
    import time
    print("[脚本额外] 三种写法算同一条包络，各要多久（30 秒音乐）")
    y, _ = io.load("debussy", seconds=30)
    N, H = FRAME_LENGTH, HOP_LENGTH

    def pure_python(y):
        out = []
        for i in range(0, len(y) - N + 1, H):
            m = 0.0
            for k in range(i, i + N):
                v = y[k] if y[k] >= 0 else -y[k]
                if v > m:
                    m = v
            out.append(m)
        return np.array(out)

    t0 = time.perf_counter()
    a = pure_python(y)
    t1 = time.perf_counter()
    b = np.array([np.abs(y[i:i + N]).max()
                  for i in range(0, len(y) - N + 1, H)])
    t2 = time.perf_counter()
    c = amplitude_envelope(frame(y))
    t3 = time.perf_counter()
    print(f"  逐个样本的 Python 循环   {(t1 - t0) * 1000:8.1f} 毫秒")
    print(f"  每帧一次 numpy 切片      {(t2 - t1) * 1000:8.2f} 毫秒")
    print(f"  下标表一次取出所有帧      {(t3 - t2) * 1000:8.2f} 毫秒")
    print(f"  三者结果完全一致：{np.allclose(a, b) and np.allclose(b, c)}")
    print("  逐个样本的循环慢两个数量级，这一条没有悬念。但下标表并不是最快的：")
    print("  它要把 (帧数, 帧长) 这张表整个复制出来，只算一个最大值并不划算。")
    print("  下标表的价值在于同一批帧要反复使用（第 09 课三个特征共用一次分帧）。")
    print()


if __name__ == "__main__":
    step1_absolute_first()
    y, env = step2_real_envelope()
    step3_time_axis(y, env)
    level_frame_length()
    level_tail_policy()
    level_librosa_center()
    extra_three_music()
    extra_speed()

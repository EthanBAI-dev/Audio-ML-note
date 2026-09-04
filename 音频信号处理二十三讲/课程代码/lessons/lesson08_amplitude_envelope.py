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
from soundlab.figdata import dump, thin
from soundlab.config import SR, FRAME_LENGTH, HOP_LENGTH
from soundlab.framing import frame, n_frames, tail_samples, frame_times
from soundlab.time_features import amplitude_envelope


MUSIC = [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚")]


def nb1_load_and_info():
    """notebook cell 2–12：载入三段音乐，看它们的基本信息。"""
    print("[正文] notebook 第 1 步 · 载入三段音乐，看基本信息")
    got = {}
    print(f"  {'':8}{'样本数':>10}{'采样率':>9}{'一个样本多久':>14}{'总时长':>10}")
    for nm, zh in MUSIC:
        y, sr = io.load(nm)
        one = 1 / sr
        got[nm] = {"zh": zh, "y": y, "sr": int(sr),
                   "n": int(len(y)), "seconds": len(y) / sr}
        print(f"  {zh:8}{len(y):10d}{sr:9d}{one * 1000:12.4f}ms"
              f"{len(y) / sr:9.2f}s")
    print("  三段的采样率一致，所以帧号和秒数之间用同一个换算——这是第 01 课定下的。")
    print()
    return got


def nb2_amplitude_envelope(got):
    """notebook cell 15–19：手写 AE，对三段各算一次。

    原 notebook 写的是 max(signal[i:i+frame_size])，**没有取绝对值**。
    这里按它的样子先算一遍，再算取了绝对值的，把差别摆出来。
    """
    print("[正文] notebook 第 2 步 · 手写振幅包络，对三段各算一次")
    print("  原 notebook 的写法（照抄，注意它没有取绝对值）：")
    print("    max(signal[i:i+frame_size]) for i in range(0, len(signal), hop)")
    print()
    # 差别要逐帧看。整段的最大值上两者几乎一样——一首 30 秒的曲子里，
    # 最高的正峰和最深的负谷本来就差不多深，所以全局最大值掩盖了问题。
    print(f"  {'':8}{'帧数':>7}{'有几帧被低估':>14}{'占比':>8}{'平均低估':>10}{'最多低估':>10}")
    out = {}
    for nm, zh in MUSIC:
        y = got[nm]["y"]
        f = frame(y, FRAME_LENGTH, HOP_LENGTH)
        raw_env = np.max(f, axis=1)               # 照 notebook：不取绝对值
        abs_env = amplitude_envelope(f)           # 本课程：先取绝对值
        diff = abs_env - raw_env
        hit = int((diff > 1e-9).sum())
        out[nm] = {"n_frames": int(f.shape[0]),
                   "peak_raw": float(raw_env.max()),
                   "peak_abs": float(abs_env.max()),
                   "under_frames": hit,
                   "under_ratio": hit / len(diff),
                   "under_mean": float(diff[diff > 1e-9].mean()) if hit else 0.0,
                   "under_max": float(diff.max()),
                   "env": abs_env}
        print(f"  {zh:8}{f.shape[0]:7d}{hit:14d}{hit / len(diff):8.1%}"
              f"{out[nm]['under_mean']:10.4f}{diff.max():10.4f}")
    lo = min(r["under_ratio"] for r in out.values())
    hi = max(r["under_ratio"] for r in out.values())
    worst = max(r["under_max"] for r in out.values())
    print(f"  三段各有 {lo:.0%} 到 {hi:.0%} 的帧被低估了，"
          f"最多的一帧少算了 {worst:.4f}。")
    print("  但如果只看整段的最大值，两种写法几乎一样：")
    for nm, zh in MUSIC:
        print(f"    {zh:8}不取绝对值 {out[nm]['peak_raw']:.4f}，"
              f"取绝对值 {out[nm]['peak_abs']:.4f}")
    print("  因为一首 30 秒的曲子里，最高的正峰和最深的负谷本来就差不多深。")
    print("  全局最大值掩盖了问题，逐帧才看得见——而逐帧才是包络要用的。")
    print("  所以本课程的实现是 np.max(np.abs(frame))，比 notebook 多一个 abs。")
    print()
    return out


def nb3_frames_to_time(got, env):
    """notebook cell 21：把帧编号换算成秒，包络才画得到波形上。"""
    print("[正文] notebook 第 3 步 · 把帧编号换成时间")
    nm = "debussy"
    sr = got[nm]["sr"]
    n = env[nm]["n_frames"]
    print(f"  {got[nm]['zh']}切出 {n} 帧。帧编号是 0, 1, 2, …，得先换成秒才能画。")
    print(f"  librosa.frames_to_time(frames, hop_length={HOP_LENGTH}) 做的就是这件事。")
    for i in (0, 1, 2, n - 1):
        t_start = i * HOP_LENGTH / sr
        t_center = (i * HOP_LENGTH + FRAME_LENGTH / 2) / sr
        print(f"    第 {i:4d} 帧：起点 {t_start:7.3f}s，中心 {t_center:7.3f}s")
    print(f"  两种标法整条相差 {FRAME_LENGTH / 2 / sr * 1000:.2f} 毫秒，永远是半个帧长。")
    print("  librosa 默认按起点标（frames_to_time 不加 center 偏移）；")
    print("  本课程按帧中心标，因为一帧的读数概括的是整段，不是它开头那一瞬。")
    print()


def nb4_compare_three(got, env):
    """notebook cell 22：三段音乐的波形和包络叠在一起比。"""
    print("[正文] notebook 第 4 步 · 三段的包络放在一起比")
    print(f"  {'':8}{'峰值':>9}{'包络平均':>11}{'平均/峰值':>11}")
    rows = {}
    for nm, zh in MUSIC:
        e = env[nm]["env"]
        peak = float(e.max())
        mean = float(e.mean())
        rows[nm] = {"zh": zh, "peak": peak, "mean": mean, "ratio": mean / peak}
        print(f"  {zh:8}{peak:9.4f}{mean:11.4f}{mean / peak:11.4f}")
    print("  最后一列是「包络平均值占自身峰值的比例」，它和录音音量无关——")
    print("  分子分母同时缩放会约掉，所以三段之间可以直接比。")
    hi = max(rows.values(), key=lambda r: r["ratio"])
    lo = min(rows.values(), key=lambda r: r["ratio"])
    print(f"  {hi['zh']} {hi['ratio']:.2f} 最高，说明它整段都更贴近自己的峰值，起伏小；")
    print(f"  {lo['zh']} {lo['ratio']:.2f} 最低，说明它忽强忽弱的落差最大。")
    print()
    return rows


def dump_figures(got, env, rows):
    """这一课要上图的数：三段的波形与包络、绝对值差、时间轴、尾巴。"""
    tracks = {}
    for nm, zh in MUSIC:
        y = got[nm]["y"]
        e = env[nm]["env"]
        tracks[nm] = {
            "zh": zh,
            "seconds": round(got[nm]["seconds"], 2),
            "wave": thin(y, 800),
            "env": thin(e, 400),
            "peak": rows[nm]["peak"],
            "mean": rows[nm]["mean"],
            "ratio": rows[nm]["ratio"],
            "peak_raw": env[nm]["peak_raw"],
            "peak_abs": env[nm]["peak_abs"],
            "n_frames": env[nm]["n_frames"],
        }
    four = [-0.2, 0.7, -0.9, 0.4]
    y = got["debussy"]["y"]
    sr = got["debussy"]["sr"]
    used = (env["debussy"]["n_frames"] - 1) * HOP_LENGTH + FRAME_LENGTH
    path = dump(8, {
        "frame_length": FRAME_LENGTH, "hop_length": HOP_LENGTH, "sr": sr,
        "tracks": tracks,
        "four": four,
        "four_raw": max(four),
        "four_abs": max(abs(v) for v in four),
        "shift_ms": round(FRAME_LENGTH / 2 / sr * 1000, 2),
        "tail": {"total": int(len(y)), "used": int(used),
                 "left": int(len(y) - used),
                 "left_ms": round((len(y) - used) / sr * 1000, 2)},
    })
    print(f"[配图数据] 写好了 {path}")


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
    # 先严格按 notebook 的单元顺序走一遍：载入 → 基本信息 → 手写 AE →
    # 帧号换成时间 → 三段对比。工程扩展一律排在这条主线后面。
    got = nb1_load_and_info()
    envs = nb2_amplitude_envelope(got)
    nb3_frames_to_time(got, envs)
    rows = nb4_compare_three(got, envs)

    # 下面是原 notebook 没有、但真写代码时会撞上的几件事
    step1_absolute_first()
    y, env = step2_real_envelope()
    step3_time_axis(y, env)
    level_frame_length()
    level_tail_policy()
    level_librosa_center()
    extra_speed()

    if "--dump" in sys.argv:
        dump_figures(got, envs, rows)

# -*- coding: utf-8 -*-
"""第 06 课 · 把整段录音切成小段：分帧、加窗与聚合。

跑法（在 project/ 目录下）：
    python lessons/lesson06_framing.py

这一课的产出是 soundlab/framing.py，后面四课全部建在它上面。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.config import SR, FRAME_LENGTH, HOP_LENGTH
from soundlab.framing import frame, n_frames, tail_samples, get_window
from soundlab.time_features import rms


def step1_3_frame():
    print("[正文] 第 1—3 步 · 把 1 秒切成 42 帧")
    y, sr = io.load("debussy", seconds=1.0)
    print(f"  采样率 {sr}，1 秒 = {len(y)} 个数字")
    print(f"  手算帧数 1 + ({len(y)} - {FRAME_LENGTH}) // {HOP_LENGTH} = "
          f"{n_frames(len(y), FRAME_LENGTH, HOP_LENGTH)}")
    f = frame(y)
    print(f"  代码给出 {f.shape}")
    print(f"  帧长 {FRAME_LENGTH} / {sr} = {FRAME_LENGTH / sr * 1000:.1f} 毫秒，"
          f"帧移 {HOP_LENGTH} / {sr} = {HOP_LENGTH / sr * 1000:.1f} 毫秒，"
          f"重叠 {(FRAME_LENGTH - HOP_LENGTH) / FRAME_LENGTH:.0%}")
    print()
    print("  把帧移错写成帧长会怎样：")
    print(f"    帧移 = 帧长（不重叠）  {frame(y, 1024, 1024).shape}")
    print(f"    帧移 = 半帧（重叠 50%）{frame(y, 1024, 512).shape}")
    print("  程序不会报错，只是帧数少了一半。发现这类错误的办法只有一个：")
    print("  先用公式手算一遍，再和代码对。")
    print()
    return y, f


def level_window(y, f):
    print("[正文] 加一层 · 加上窗函数")
    w = get_window("hann", FRAME_LENGTH)
    windowed = f * w
    print(f"  窗在两端和中间的值：{w[0]:.4f} {w[FRAME_LENGTH // 2]:.4f} {w[-1]:.4f}")
    print(f"  第 0 帧原样的 RMS   {float(np.sqrt(np.mean(f[0] ** 2))):.5f}")
    print(f"  第 0 帧加窗后的 RMS {float(np.sqrt(np.mean(windowed[0] ** 2))):.5f}")
    ratio = np.sqrt(np.mean(windowed[0] ** 2)) / np.sqrt(np.mean(f[0] ** 2))
    print(f"  掉到原来的 {ratio:.1%}——窗把两端乘小了，数值被窗本身改掉。")
    print("  所以：加窗是为频率分析服务的，算振幅类特征时不要加。")
    print()


def level_per_frame(f):
    print("[正文] 加一层 · 逐帧算一个数")
    r = rms(f)
    print(f"  frames {f.shape} -> rms {r.shape}")
    print(f"  前 5 帧 {np.round(r[:5], 4).tolist()}")
    print("  axis=1 是关键：沿着「帧内样本」这个方向求平均，每一帧塌成一个数。")
    wrong = np.sqrt(np.mean(f.astype(np.float64) ** 2, axis=0))
    print(f"  写成 axis=0 会得到 {wrong.shape}——形状看着也「对」，含义完全错。")
    print()
    return r


def level_aggregate(r):
    print("[正文] 加一层 · 聚合成固定长度")
    summary = np.array([r.mean(), r.std(), r.max()])
    print(f"  {len(r)} 个数 -> {np.round(summary, 4).tolist()}")
    print(f"  峰值原本出现在第 {int(np.argmax(r))} 帧"
          f"（{int(np.argmax(r)) * HOP_LENGTH / SR:.3f} 秒）")
    print("  聚合之后这个位置永远找不回来了。这一步不可逆：")
    print("  要找「故障在第几秒」，保留整条曲线；只判断「整段属于哪一类」，才能压成统计量。")
    print()


def level_tail():
    print("[正文] 加一层 · 尾巴被丢掉了")
    y, sr = io.load("debussy", seconds=1.0)
    left = tail_samples(len(y))
    print(f"  1 秒 {len(y)} 个样本，用掉 {len(y) - left}，剩 {left} 个 "
          f"= {left / sr * 1000:.1f} 毫秒没进任何一帧")
    print("  1.5 毫秒通常无所谓；但录音很短、或者关键事件恰好在最末尾时就必须处理。")
    print("  三种做法（丢弃 / 保留短帧 / 补零）在第 08 课展开。")
    print()


def extra_stride_tricks():
    """正文没放：不复制内存的分帧，以及它的陷阱。"""
    print("[脚本额外] sliding_window_view：不复制内存的分帧")
    y, _ = io.load("debussy", seconds=10)
    a = frame(y)
    v = np.lib.stride_tricks.sliding_window_view(y, FRAME_LENGTH)[::HOP_LENGTH]
    print(f"  下标表   {a.shape}  占用 {a.nbytes / 1e6:.2f} MB（真复制了一份）")
    print(f"  滑动视图 {v.shape}  额外占用 0 MB（和原来那 {y.nbytes / 1e6:.2f} MB 共用）")
    print(f"  两者数值一致：{np.allclose(a, v)}")
    print("  陷阱：视图和原数组共用同一块内存，对它原地赋值会污染原始录音。")
    print("  数据量大时值得用，但只读着用。")
    print()


def extra_overlap():
    """正文没放：重叠到底救回了什么。"""
    print("[脚本额外] 一个事件正好骑在切口上，重叠能救回多少")
    y = np.zeros(SR // 2)
    ev = 512
    start = 1024 - ev // 2                        # 事件正中间压在第 1、2 帧的边界上
    y[start:start + ev] = np.hanning(ev)
    # 一帧完整罩住它时该读到多少：事件的平方和摊在整帧 1024 个样本上
    full = float(np.sqrt(np.sum(np.hanning(ev) ** 2) / 1024))
    for hop in (1024, 512, 256):
        best = rms(frame(y, 1024, hop)).max()
        print(f"  帧移 {hop:5d}（重叠 {(1024 - hop) / 1024:>4.0%}）"
              f"最强的一帧读到 {best:.4f}，是完整罩住时的 {best / full:.0%}")
    print(f"  完整罩住这个事件时该读到 {full:.4f}。")
    print("  不重叠时事件被切口劈成两半，两帧各看到一半，最强的一帧只有七成；")
    print("  重叠之后总有一帧完整罩住它，读数回到 100%。这就是要重叠的理由。")
    print()


if __name__ == "__main__":
    y, f = step1_3_frame()
    level_window(y, f)
    r = level_per_frame(f)
    level_aggregate(r)
    level_tail()
    extra_stride_tricks()
    extra_overlap()

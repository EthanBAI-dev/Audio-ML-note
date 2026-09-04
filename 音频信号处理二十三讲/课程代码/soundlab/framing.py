# -*- coding: utf-8 -*-
"""分帧与加窗（第 06 课）。

全课程只有这一个分帧实现。第 01 课的教训：手写分帧和 librosa 的分帧差
半个窗，同一段录音能算出 3.5 倍和 11.4 倍两个不同的结论。
"""
import numpy as np

from .config import FRAME_LENGTH, HOP_LENGTH


def n_frames(n_samples, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH):
    """只保留完整帧时能切出多少帧：1 + floor((L - K) / H)。"""
    if n_samples < frame_length:
        return 0
    return 1 + (n_samples - frame_length) // hop_length


def frame(y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, window=None):
    """把一维信号切成 (帧数, 帧长) 的二维数组。

    用下标表一次取出所有帧，不写 Python 循环——数据量大时快一到两个数量级。
    window 只在后面要做频率分析时才传；算振幅类特征时传了会把数值改小。
    """
    y = np.asarray(y)
    m = n_frames(len(y), frame_length, hop_length)
    if m == 0:
        raise ValueError(f"信号只有 {len(y)} 个样本，不够一帧（{frame_length}）")
    idx = np.arange(frame_length)[None, :] + hop_length * np.arange(m)[:, None]
    out = y[idx]
    if window is not None:
        out = out * get_window(window, frame_length)
    return out


def get_window(name, frame_length):
    """按名字取窗函数。两端压到 0，中间保持 1。"""
    if name in (None, "none", "rect", "boxcar"):
        return np.ones(frame_length)
    if name == "hann":
        return np.hanning(frame_length)
    if name == "hamming":
        return np.hamming(frame_length)
    raise ValueError(f"没有这个窗：{name}")


def tail_samples(n_samples, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH):
    """结尾有多少个样本没进任何一帧。"""
    m = n_frames(n_samples, frame_length, hop_length)
    used = (m - 1) * hop_length + frame_length if m else 0
    return n_samples - used


def frame_times(m, hop_length=HOP_LENGTH, frame_length=FRAME_LENGTH, sr=22050,
                where="center"):
    """每一帧标在时间轴的哪个位置，单位秒。

    where="start" 标帧的起点，where="center" 标帧的中间。两者相差
    frame_length / 2 个样本；画图时用错哪一个，曲线会整体平移半个帧长。
    """
    starts = np.arange(m) * hop_length
    if where == "center":
        starts = starts + frame_length / 2
    elif where != "start":
        raise ValueError("where 只能是 'start' 或 'center'")
    return starts / sr

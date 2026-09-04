# -*- coding: utf-8 -*-
"""三种时域特征：振幅包络、均方根、过零率（第 07–09 课）。

三个函数都吃 (帧数, 帧长) 的二维数组，各吐出一条长度等于帧数的曲线。
分帧交给 framing.frame()，这里不再自己切。
"""
import numpy as np

from .framing import frame
from .config import FRAME_LENGTH, HOP_LENGTH


def amplitude_envelope(frames):
    """每帧离中线最远的那个数：先取绝对值，再取最大值。

    顺序不能反。直接 max() 会漏掉负方向上的峰——一帧里最深的那个谷
    也是一次很大的振动。
    """
    return np.max(np.abs(frames), axis=1)


def rms(frames):
    """每帧的均方根：平方 → 求平均 → 开平方。

    平方是为了让正负不互相抵消；开平方是为了把量级换回和原始样本一样，
    这样它和振幅包络可以画在同一张图上比较。
    """
    return np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1))


def zero_crossing_rate(frames, threshold=0.0):
    """每帧穿过中线的次数，除以这一帧里相邻数字对的个数。

    threshold 把离零很近的数当成零，避免录音底噪让正负号来回翻。
    设成 0 就是标准定义。
    """
    frames = np.asarray(frames)
    sign = np.zeros(frames.shape, dtype=np.int8)
    sign[frames > threshold] = 1
    sign[frames < -threshold] = -1
    out = np.zeros(frames.shape[0])
    for i, row in enumerate(sign):
        nz = row[row != 0]
        if len(nz) >= 2:
            out[i] = np.count_nonzero(nz[1:] != nz[:-1]) / (frames.shape[1] - 1)
    return out


def all_three(y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, threshold=0.0):
    """一次算出三条曲线，返回一个字典。"""
    f = frame(y, frame_length, hop_length)
    return {
        "ae": amplitude_envelope(f),
        "rms": rms(f),
        "zcr": zero_crossing_rate(f, threshold),
        "n_frames": f.shape[0],
    }


def summarize(curve):
    """把一条逐帧曲线压成四个统计量。这一步不可逆，时间位置没了。"""
    return {
        "mean": float(np.mean(curve)),
        "std": float(np.std(curve)),
        "max": float(np.max(curve)),
        "min": float(np.min(curve)),
    }

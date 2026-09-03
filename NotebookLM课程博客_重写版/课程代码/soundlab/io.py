# -*- coding: utf-8 -*-
"""读音频：统一采样率、统一单声道、可选统一响度。

第 04 课的结论是「采样率不一致会毁掉整个数据集」，所以这里不给 sr=None
这个选项——所有音频进来就被重采样到同一个 SR。
"""
import os

import numpy as np
import librosa

from .config import SR, TARGET_DBFS, audio_dir


def load(name, sr=SR, seconds=None, offset=0.0):
    """按名字读一段课程音频，返回一维 float32 数组。

    name 可以写成 "debussy" 或 "debussy.wav"，也可以是完整路径。
    seconds 给出后只取开头这么多秒。
    """
    path = name if os.path.sep in name or name.endswith(".wav") and os.path.exists(name) else None
    if path is None:
        fn = name if name.endswith(".wav") else name + ".wav"
        path = os.path.join(audio_dir(), fn)
    y, actual_sr = librosa.load(path, sr=sr, mono=True, offset=offset,
                                duration=seconds)
    return y.astype(np.float32), actual_sr


def peak_normalize(y):
    """把整段除以它的最大绝对值，最高峰变成 1.0。"""
    return y / max(float(np.abs(y).max()), 1e-12)


def rms_normalize(y, target_dbfs=TARGET_DBFS):
    """把整段乘一个数，使它的均方根落在指定电平上（第 03 课的响度统一）。

    这一步只是整段乘一个正数：波形的形状、穿过中线的次数都不变，
    变的只有「录得多响」。第 07 课会用它来分开这两件事。
    """
    r = float(np.sqrt(np.mean(y.astype(np.float64) ** 2)))
    return (y * (10 ** (target_dbfs / 20) / max(r, 1e-12))).astype(np.float32)


def dbfs(y):
    """整段的均方根电平，单位 dBFS。满刻度正弦波约为 -3.01。"""
    r = float(np.sqrt(np.mean(y.astype(np.float64) ** 2)))
    return 20 * np.log10(max(r, 1e-12))

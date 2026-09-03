# -*- coding: utf-8 -*-
"""用已知频率去试探一段声音（第 10 课）。

这是傅里叶变换的手写版：拿一支已知频率的波去乘信号，再求平均。
频率对上了，平均值不为零；对不上，正负互相抵消成零。
第 11–14 课会把这两支试探波换成一个复数，公式就变成课本上的样子。
"""
import numpy as np


def probe(x, freq, sr, kind="sin"):
    """一支试探波的结果：相乘、求平均、乘 2。

    乘 2 是为了让「信号里正好有一支幅度 A 的同频波」时结果等于 A，
    读数直接就是幅度，不用再换算。
    """
    t = np.arange(len(x)) / sr
    wave = np.sin(2 * np.pi * freq * t) if kind == "sin" else np.cos(2 * np.pi * freq * t)
    return float(2 * np.mean(x * wave))


def magnitude(x, freq, sr):
    """两支试探波（正弦和余弦）合起来的强度。

    单用一支会被起点位置抹掉：信号没变，只是起点挪了四分之一圈，
    读数就掉到 0。两支合起来取直角边长，起点挪到哪里读数都一样。
    """
    return float(np.hypot(probe(x, freq, sr, "sin"), probe(x, freq, sr, "cos")))


def phase(x, freq, sr):
    """这支成分从哪个位置起步，单位弧度。"""
    return float(np.arctan2(probe(x, freq, sr, "sin"), probe(x, freq, sr, "cos")))


def sweep(x, freqs, sr, mode="magnitude"):
    """把试探频率逐个试过去，每个记一个数。得到的就是一条频谱。"""
    if mode == "magnitude":
        return np.array([magnitude(x, f, sr) for f in freqs])
    return np.array([probe(x, f, sr, mode) for f in freqs])

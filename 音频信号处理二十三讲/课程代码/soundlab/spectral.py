# -*- coding: utf-8 -*-
"""频域工具：从整段单边 FFT 扩展到不补边的 STFT。

第 14 课使用单边 FFT 与频率轴；第 15 课在同一套约定上增加移动短窗、
STFT 形状和功率声谱图。矩阵统一采用（频率格，时间帧）的方向。
"""
import numpy as np

from .framing import frame, get_window, n_frames


def rfft_magnitude(y, sr):
    """返回非负频率轴、复数系数和未经幅值校准的模。"""
    samples = np.asarray(y, dtype=float)
    coefficients = np.fft.rfft(samples)
    frequencies = np.fft.rfftfreq(len(samples), d=1 / sr)
    return frequencies, coefficients, np.abs(coefficients)


def relative_db(magnitude, reference_mask=None, floor=None):
    """把指定范围内的最高值设为 0 dB；可选地截住显示下限。"""
    values = np.asarray(magnitude, dtype=float)
    chosen = values if reference_mask is None else values[np.asarray(reference_mask, dtype=bool)]
    if chosen.size == 0:
        raise ValueError("reference_mask 没有选中任何频率格")
    reference = max(float(np.max(chosen)), 1e-15)
    out = 20 * np.log10(np.maximum(values, 1e-15) / reference)
    return np.maximum(out, floor) if floor is not None else out


def pool_spectrum_max(frequencies, values, max_hz, bins=520, floor_value=-72.0):
    """按等宽 Hz 区间取最大值，保住窄峰并控制配图数据量。"""
    frequencies = np.asarray(frequencies, dtype=float)
    values = np.asarray(values, dtype=float)
    edges = np.linspace(0.0, max_hz, bins + 1)
    pooled_frequencies = (edges[:-1] + edges[1:]) / 2
    pooled_values = np.full(bins, floor_value, dtype=float)
    for i, (left, right) in enumerate(zip(edges[:-1], edges[1:])):
        if i == bins - 1:
            mask = (frequencies >= left) & (frequencies <= right)
        else:
            mask = (frequencies >= left) & (frequencies < right)
        if np.any(mask):
            pooled_values[i] = max(float(np.max(values[mask])), floor_value)
    return pooled_frequencies, pooled_values


def stft_shape(n_samples, frame_length, hop_length):
    """返回不补边 STFT 的形状：（非负频率格数，完整帧数）。"""
    if frame_length <= 0 or hop_length <= 0:
        raise ValueError("frame_length 和 hop_length 必须是正整数")
    return frame_length // 2 + 1, n_frames(n_samples, frame_length, hop_length)


def stft(y, frame_length, hop_length, window="hann"):
    """移动短窗并逐帧做 rFFT，返回（频率格，时间帧）复数矩阵。

    这份教学实现不在两端补值，只保留完整帧。窗长、帧长和 FFT 长度都等于
    ``frame_length``；因此每个窗值都能与帧里的一个样本逐项相乘。
    """
    samples = np.asarray(y, dtype=float)
    frames = frame(samples, frame_length, hop_length, window=None)
    weights = get_window(window, frame_length)
    coefficients = np.fft.rfft(frames * weights[None, :], axis=1)
    return coefficients.T


def power_spectrogram(coefficients):
    """把 STFT 复数矩阵换成功率矩阵 ``abs(S) ** 2``。"""
    return np.abs(np.asarray(coefficients)) ** 2

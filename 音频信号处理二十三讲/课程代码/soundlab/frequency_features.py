# -*- coding: utf-8 -*-
"""逐帧频谱统计：BER、频谱质心和频谱带宽。

矩阵统一采用 ``(频率格, 时间帧)``。BER 用功率作权重；质心与带宽按
librosa 的约定用幅度作权重。把两种权重分开写，是为了避免公式看起来相似时
不小心混用。
"""
import numpy as np


def _matrix(values, name):
    out = np.asarray(values)
    if out.ndim != 2:
        raise ValueError(f"{name} 必须是二维矩阵（频率格, 时间帧）")
    return out


def rfft_frequencies(sample_rate, n_fft):
    """返回 rFFT 每一行真正对应的 Hz。"""
    if sample_rate <= 0 or n_fft <= 0:
        raise ValueError("sample_rate 和 n_fft 必须大于 0")
    return np.fft.rfftfreq(int(n_fft), d=1.0 / float(sample_rate))


def split_frequency_bin(sample_rate, n_fft, split_hz):
    """返回第一个 ``frequency >= split_hz`` 的格号。

    因而低频侧严格小于分界频率，高频侧大于或等于分界频率。
    """
    frequencies = rfft_frequencies(sample_rate, n_fft)
    if not 0 <= split_hz <= frequencies[-1]:
        raise ValueError(f"split_hz 必须在 0 到 Nyquist({frequencies[-1]:g}) 之间")
    return int(np.searchsorted(frequencies, split_hz, side="left"))


def band_energy_ratio_from_power(power, frequencies, split_hz):
    """逐帧计算低频功率和 / 高频功率和。

    高频功率为零而低频非零时返回 ``inf``；两边都为零的静音帧返回 ``nan``。
    这种约定保留了比值本来的数学意义，显示时再单独转成稳定的 dB。
    """
    P = _matrix(power, "power").astype(float, copy=False)
    if np.any(P < 0):
        raise ValueError("power 不能包含负数")
    f = np.asarray(frequencies, dtype=float)
    if len(f) != P.shape[0]:
        raise ValueError("frequencies 的长度必须等于 power 的行数")
    split = int(np.searchsorted(f, split_hz, side="left"))
    if split <= 0 or split >= len(f):
        raise ValueError("分界频率必须让低频侧和高频侧都至少保留一个频率格")
    low = P[:split].sum(axis=0)
    high = P[split:].sum(axis=0)
    ratio = np.divide(low, high, out=np.full_like(low, np.nan), where=high > 0)
    ratio[(high == 0) & (low > 0)] = np.inf
    return ratio, low, high, split


def band_energy_ratio(stft_matrix, sample_rate, n_fft, split_hz):
    """从复数 STFT 逐帧计算 BER。"""
    S = _matrix(stft_matrix, "stft_matrix")
    frequencies = rfft_frequencies(sample_rate, n_fft)
    if S.shape[0] != len(frequencies):
        raise ValueError("STFT 行数与 n_fft 对应的 rFFT 频率格数不一致")
    return band_energy_ratio_from_power(np.abs(S) ** 2, frequencies, split_hz)


def ratio_to_db(low, high, floor=1e-20):
    """把两份非负功率的比值写成 dB，供曲线显示。

    两边都为零的静音帧返回 ``nan``，避免把“没有可测能量”误写成 0 dB。
    """
    low = np.asarray(low, dtype=float)
    high = np.asarray(high, dtype=float)
    if low.shape != high.shape:
        raise ValueError("low 与 high 必须形状相同")
    if np.any(low < 0) or np.any(high < 0):
        raise ValueError("功率不能包含负数")
    out = 10.0 * np.log10(np.maximum(low, floor) / np.maximum(high, floor))
    return np.where((low == 0) & (high == 0), np.nan, out)


def spectral_centroid(magnitude, frequencies):
    """以幅度为权重，逐帧计算频谱质心（Hz）。

    全零帧返回 0，与 librosa 的数值约定一致；这样的 0 没有听觉解释。
    """
    M = _matrix(magnitude, "magnitude").astype(float, copy=False)
    if np.any(M < 0):
        raise ValueError("magnitude 不能包含负数")
    f = np.asarray(frequencies, dtype=float)
    if len(f) != M.shape[0]:
        raise ValueError("frequencies 的长度必须等于 magnitude 的行数")
    total = M.sum(axis=0)
    weighted = (f[:, None] * M).sum(axis=0)
    return np.divide(weighted, total, out=np.zeros_like(weighted), where=total > 0)


def spectral_bandwidth(magnitude, frequencies, centroid=None, p=2):
    """逐帧计算围绕质心的 p 次加权距离（Hz）。

    ``p=1`` 是平均绝对距离；``p=2`` 是 librosa 默认的均方根距离。
    """
    if p <= 0:
        raise ValueError("p 必须大于 0")
    M = _matrix(magnitude, "magnitude").astype(float, copy=False)
    if np.any(M < 0):
        raise ValueError("magnitude 不能包含负数")
    f = np.asarray(frequencies, dtype=float)
    if len(f) != M.shape[0]:
        raise ValueError("frequencies 的长度必须等于 magnitude 的行数")
    c = spectral_centroid(M, f) if centroid is None else np.asarray(centroid, dtype=float)
    if c.shape != (M.shape[1],):
        raise ValueError("centroid 必须是每帧一个数的一维数组")
    total = M.sum(axis=0)
    moment = (M * np.abs(f[:, None] - c[None, :]) ** p).sum(axis=0)
    mean = np.divide(moment, total, out=np.zeros_like(moment), where=total > 0)
    return mean ** (1.0 / p)

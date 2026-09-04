# -*- coding: utf-8 -*-
"""第 15 课 · 用移动短窗找回频率出现的时间。

跑法（在“课程代码”目录下）：
    python lessons/lesson15_stft.py
    python lessons/lesson15_stft.py --dump

核心顺序：整段 DFT 丢失时间 → 移动短窗 → 帧重叠 → 从 DFT 变成 STFT →
核对输出形状 → 比较窗长、帧移和 Hann 窗 → 把功率矩阵看成声谱图。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import librosa
import numpy as np

from soundlab.figdata import dump, thin
from soundlab.spectral import (
    pool_spectrum_max,
    power_spectrogram,
    relative_db,
    rfft_magnitude,
    stft,
    stft_shape,
)


ORDER_SR = 8000
ORDER_FRAME = 800
ORDER_HOP = 400
SHAPE_SR = 22050
SHAPE_SAMPLES = 10000
SHAPE_FRAME = 1000
SHAPE_HOP = 500
TRADE_SR = 16000
TRADE_SECONDS = 1.5
TRADE_FMAX = 2500
FRAME_SCAN = (512, 1024, 2048, 4096, 8192)


def _tone(frequency, samples, sr):
    t = np.arange(samples) / sr
    return np.sin(2 * np.pi * frequency * t)


def make_order_signals():
    """两段频率组成相同、先后顺序相反的声音。"""
    half = ORDER_SR // 2
    low_then_high = np.concatenate([
        _tone(300, half, ORDER_SR),
        _tone(900, half, ORDER_SR),
    ])
    high_then_low = low_then_high[::-1].copy()
    return low_then_high, high_then_low


def dominant_frequencies(coefficients, sr, frame_length):
    """返回每帧最强的非直流频率，仅用于这个双纯音验证。"""
    frequencies = np.fft.rfftfreq(frame_length, d=1 / sr)
    magnitude = np.abs(coefficients).copy()
    magnitude[0, :] = 0
    return frequencies[np.argmax(magnitude, axis=0)]


def order_experiment():
    first, second = make_order_signals()
    freqs, _, mag_first = rfft_magnitude(first, ORDER_SR)
    _, _, mag_second = rfft_magnitude(second, ORDER_SR)
    global_difference = float(np.max(np.abs(mag_first - mag_second)))

    local_first = stft(first, ORDER_FRAME, ORDER_HOP, window="hann")
    local_second = stft(second, ORDER_FRAME, ORDER_HOP, window="hann")
    dominant_first = dominant_frequencies(local_first, ORDER_SR, ORDER_FRAME)
    dominant_second = dominant_frequencies(local_second, ORDER_SR, ORDER_FRAME)

    assert global_difference < 1e-9
    assert dominant_first[0] == 300 and dominant_first[-1] == 900
    assert dominant_second[0] == 900 and dominant_second[-1] == 300

    visible = freqs <= 1400
    db_first = relative_db(mag_first, reference_mask=visible, floor=-72)
    plot_freqs, plot_db = pool_spectrum_max(
        freqs, db_first, 1400, bins=280, floor_value=-72
    )
    return {
        "first": first,
        "second": second,
        "global_difference": global_difference,
        "dominant_first": dominant_first,
        "dominant_second": dominant_second,
        "plot_freqs": plot_freqs,
        "plot_db": plot_db,
    }


def shape_experiment():
    t = np.arange(SHAPE_SAMPLES) / SHAPE_SR
    y = np.sin(2 * np.pi * 440 * t) + 0.35 * np.sin(2 * np.pi * 880 * t)
    manual = stft(y, SHAPE_FRAME, SHAPE_HOP, window="hann")
    hann = np.hanning(SHAPE_FRAME)
    library = librosa.stft(
        y,
        n_fft=SHAPE_FRAME,
        win_length=SHAPE_FRAME,
        hop_length=SHAPE_HOP,
        window=hann,
        center=False,
    )
    expected = stft_shape(SHAPE_SAMPLES, SHAPE_FRAME, SHAPE_HOP)
    difference = float(np.max(np.abs(manual - library)))
    assert expected == (501, 19)
    assert manual.shape == expected == library.shape
    assert difference < 1e-9
    return {
        "expected": expected,
        "manual_shape": manual.shape,
        "library_shape": library.shape,
        "difference": difference,
    }


def parameter_experiment():
    frame_rows = []
    for frame_length in FRAME_SCAN:
        frame_rows.append({
            "frame_length": frame_length,
            "window_ms": 1000 * frame_length / SHAPE_SR,
            "bin_hz": SHAPE_SR / frame_length,
        })

    hop_rows = []
    for hop_length in (500, 250, 125):
        _, frames = stft_shape(SHAPE_SAMPLES, SHAPE_FRAME, hop_length)
        hop_rows.append({
            "hop_length": hop_length,
            "overlap_percent": 100 * (1 - hop_length / SHAPE_FRAME),
            "frames": frames,
        })

    hann = np.hanning(SHAPE_FRAME)
    assert [row["frames"] for row in hop_rows] == [19, 37, 73]
    assert hann[0] == 0 and hann[-1] == 0
    return {
        "frame_rows": frame_rows,
        "hop_rows": hop_rows,
        "hann": hann,
        "hann_center": float(hann[SHAPE_FRAME // 2]),
    }


def make_tradeoff_signal():
    samples = int(TRADE_SR * TRADE_SECONDS)
    t = np.arange(samples) / TRADE_SR
    start_hz, end_hz = 250.0, 1800.0
    rate = (end_hz - start_hz) / TRADE_SECONDS
    phase = 2 * np.pi * (start_hz * t + 0.5 * rate * t ** 2)
    chirp = 0.65 * np.sin(phase)
    click = 1.8 * np.exp(-0.5 * ((t - 0.75) / 0.0008) ** 2)
    return t, chirp + click


def _spectrogram_payload(coefficients, sr, frame_length, hop_length):
    magnitude = np.abs(coefficients).T
    return {
        "sampleRate": sr,
        "nfft": frame_length,
        "hop": hop_length,
        "bins": coefficients.shape[0],
        "frames": coefficients.shape[1],
        "mag": magnitude.ravel(),
        "duration": (coefficients.shape[1] - 1) * hop_length / sr,
    }


def tradeoff_experiment():
    t, y = make_tradeoff_signal()
    settings = [(256, 64), (1024, 256)]
    outputs = []
    for frame_length, hop_length in settings:
        coefficients = stft(y, frame_length, hop_length, window="hann")
        power = power_spectrogram(coefficients)
        outputs.append({
            "frame_length": frame_length,
            "hop_length": hop_length,
            "window_ms": 1000 * frame_length / TRADE_SR,
            "bin_hz": TRADE_SR / frame_length,
            "shape": coefficients.shape,
            "max_power": float(np.max(power)),
            "plot": _spectrogram_payload(
                coefficients, TRADE_SR, frame_length, hop_length
            ),
        })
    return {"t": t, "y": y, "outputs": outputs}


def print_results(order, shape, params, trade):
    print("[正文] 第 1 步 · 整段频谱知道有什么，却不知道先后顺序")
    print(f"  两段信号都含 300 Hz 和 900 Hz，整段幅度谱最大差 = {order['global_difference']:.3e}")
    print(
        "  逐帧最强频率：第一段 "
        f"{order['dominant_first'][0]:.0f} → {order['dominant_first'][-1]:.0f} Hz；"
        f"第二段 {order['dominant_second'][0]:.0f} → {order['dominant_second'][-1]:.0f} Hz。"
    )
    print("  所以整段频谱分不出顺序，移动短窗可以。")
    print()

    print("[正文] 第 2 步 · 10000 个样本怎样变成 501 × 19")
    print(f"  非负频率格 = {SHAPE_FRAME} // 2 + 1 = {shape['expected'][0]}")
    print(
        f"  完整帧数 = ({SHAPE_SAMPLES} - {SHAPE_FRAME}) // "
        f"{SHAPE_HOP} + 1 = {shape['expected'][1]}"
    )
    print(f"  手写 STFT 形状 = {shape['manual_shape']}")
    print(f"  librosa(center=False) 形状 = {shape['library_shape']}")
    print(f"  两者复数最大差 = {shape['difference']:.3e}")
    print("  第一维是频率，第二维是时间帧。")
    print()

    print("[正文] 第 3 步 · 帧长决定两把尺子的精细程度")
    for row in params["frame_rows"]:
        print(
            f"  N={row['frame_length']:4d}：覆盖 {row['window_ms']:7.2f} ms，"
            f"频率间隔 {row['bin_hz']:6.2f} Hz"
        )
    print("  帧越长，频率格越密；但一次覆盖的时间也越长。")
    print()

    print("[正文] 第 4 步 · 帧移决定重叠和列数")
    for row in params["hop_rows"]:
        print(
            f"  H={row['hop_length']:3d}：重叠 {row['overlap_percent']:.1f}% ，"
            f"得到 {row['frames']} 帧"
        )
    print("  帧移越小，时间取点越密，计算列数也越多。")
    print()

    print("[正文] 第 5 步 · Hann 窗和功率声谱图")
    print(
        f"  Hann 窗：左端 {params['hann'][0]:.1f}，中心 {params['hann_center']:.6f}，"
        f"右端 {params['hann'][-1]:.1f}"
    )
    for row in trade["outputs"]:
        print(
            f"  {row['window_ms']:.0f} ms 窗：shape={row['shape']}，"
            f"频率间隔 {row['bin_hz']:.2f} Hz"
        )
    print("  功率矩阵 abs(S) ** 2 可以用颜色显示成声谱图。")
    print()

    print("[脚本额外] 本课所有 STFT 都明确使用 center=False，只保留完整帧。")
    print("  第 16 课再比较库的补边默认值和不同声谱图显示口径。")


def dump_figures(order, shape, params, trade):
    path = dump(15, {
        "order": {
            "sr": ORDER_SR,
            "frame_length": ORDER_FRAME,
            "hop_length": ORDER_HOP,
            "wave_first": thin(order["first"], 360),
            "wave_second": thin(order["second"], 360),
            "global_difference": order["global_difference"],
            "dominant_first": order["dominant_first"],
            "dominant_second": order["dominant_second"],
            "plot_freqs": order["plot_freqs"],
            "plot_db": order["plot_db"],
        },
        "shape": {
            "samples": SHAPE_SAMPLES,
            "frame_length": SHAPE_FRAME,
            "hop_length": SHAPE_HOP,
            "frequency_bins": shape["expected"][0],
            "frames": shape["expected"][1],
            "difference": shape["difference"],
        },
        "parameters": {
            "sr": SHAPE_SR,
            "frame_rows": params["frame_rows"],
            "hop_rows": params["hop_rows"],
            "hann": thin(params["hann"], 240),
            "hann_center": params["hann_center"],
        },
        "tradeoff": {
            "sr": TRADE_SR,
            "seconds": TRADE_SECONDS,
            "fmax": TRADE_FMAX,
            "wave": thin(trade["y"], 420),
            "outputs": trade["outputs"],
        },
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    order_data = order_experiment()
    shape_data = shape_experiment()
    parameter_data = parameter_experiment()
    tradeoff_data = tradeoff_experiment()
    print_results(order_data, shape_data, parameter_data, tradeoff_data)
    if "--dump" in sys.argv:
        dump_figures(order_data, shape_data, parameter_data, tradeoff_data)

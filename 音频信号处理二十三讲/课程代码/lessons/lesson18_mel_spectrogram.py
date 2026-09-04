# -*- coding: utf-8 -*-
"""第 18 课 · 用 Python 提取梅尔声谱图，并和第 17 课手写的那套对齐。

跑法（在 project/ 目录下）：
    python lessons/lesson18_mel_spectrogram.py
    python lessons/lesson18_mel_spectrogram.py --dump

对应 source_course/18 - Extracting Mel Spectrograms with Python/
Extracting Mel Spectrograms.ipynb。

Notebook 的顺序是：载入 scale → librosa.filters.mel(n_fft=2048, sr=22050,
n_mels=10) → 看 shape → 画滤波器组 → librosa.feature.melspectrogram →
看 shape → power_to_db → 再看 shape → 画图。

Notebook 打印完 shape 就过去了。这一课要多做一件事：**把库的结果和第 17 课
手写的那套摆在一起对齐。** 一上来就对不上，而三处对不上的地方，每一处都是
一个会咬人的默认值。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

from soundlab import io
from soundlab.config import SR
from soundlab.figdata import dump

FRAME_SIZE = 2048
HOP_SIZE = 512
N_MELS = 10
FMAX = 8000.0


def hz_to_mel(f):
    """第 17 课那条公式。业内把它叫 HTK 公式——这个名字待会儿会变得重要。"""
    return 2595.0 * np.log10(1.0 + np.asarray(f, dtype=float) / 700.0)


def mel_to_hz(m):
    return 700.0 * (10.0 ** (np.asarray(m, dtype=float) / 2595.0) - 1.0)


def hand_built_bank(n_mels=N_MELS, fmax=FMAX):
    """把第 17 课那五步原样搬过来，作为对照的基准。"""
    n_bins = FRAME_SIZE // 2 + 1
    bin_hz = SR / FRAME_SIZE
    points = mel_to_hz(np.linspace(hz_to_mel(0.0), hz_to_mel(fmax), n_mels + 2))
    bins = np.round(points / bin_hz).astype(int)
    bank = np.zeros((n_mels, n_bins))
    for i in range(n_mels):
        left, peak, right = bins[i], bins[i + 1], bins[i + 2]
        for k in range(left, peak):
            bank[i, k] = (k - left) / (peak - left)
        for k in range(peak, right):
            bank[i, k] = (right - k) / (right - peak)
    return bank


def nb1_load():
    """cell 3—5。"""
    print("[正文] 第 1 步 · 载入音阶")
    y, sr = io.load("scale")
    print(f"  {len(y)} 个样本，{len(y) / sr:.2f} 秒，{sr} Hz")
    print()
    return y


def nb2_filter_bank():
    """cell 7—8：一行拿到滤波器组，形状对上了。"""
    print("[正文] 第 2 步 · 一行拿到滤波器组")
    bank = librosa.filters.mel(sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS)
    print(f"  librosa.filters.mel(sr={SR}, n_fft={FRAME_SIZE}, n_mels={N_MELS})")
    print(f"  shape = {bank.shape}，和第 17 课手写的一样是 "
          f"({N_MELS}, {FRAME_SIZE // 2 + 1})")
    print()
    return bank


def nb3_align(library_default):
    """源 Notebook 没做的一步：把库的结果和手写的对齐。"""
    print("[正文] 第 3 步 · 形状一样，数字全不一样")
    mine = hand_built_bank()
    bin_hz = SR / FRAME_SIZE
    stages = []

    def compare(name, bank, note):
        diff = float(np.abs(mine - bank).max())
        peaks = bank.argmax(axis=1)
        row = {
            "name": name, "note": note, "max_diff": diff,
            "peak_value": float(bank.max()),
            "row_sum": float(bank[0].sum()),
            "peak_bins": [int(v) for v in peaks],
            "peak_hz": [float(v * bin_hz) for v in peaks],
            "same_peaks": bool(np.array_equal(peaks, mine.argmax(axis=1))),
        }
        stages.append(row)
        print(f"  {name}")
        print(f"    三角形顶点落在第 " + "、".join(str(v) for v in peaks[:5]) + " … 格")
        print(f"    最高的那个权重 {bank.max():.4f}，第一行加起来 {bank[0].sum():.4f}")
        print(f"    和手写那版的最大差 {diff:.4f}"
              f"（顶点位置{'一致' if row['same_peaks'] else '不一致'}）")
        return row

    print("  手写那版：顶点在第 "
          + "、".join(str(v) for v in mine.argmax(axis=1)[:5]) + " … 格，"
          f"最高权重 {mine.max():.4f}，第一行加起来 {mine[0].sum():.4f}")
    stages.append({
        "name": "手写那版（第 17 课）", "note": "对照基准",
        "max_diff": 0.0, "peak_value": float(mine.max()),
        "row_sum": float(mine[0].sum()),
        "peak_bins": [int(v) for v in mine.argmax(axis=1)],
        "peak_hz": [float(v * bin_hz) for v in mine.argmax(axis=1)],
        "same_peaks": True, "baseline": True,
    })
    compare("① 库的默认值", library_default, "什么都没改")

    # 差别一：最高频率。库默认一直取到奈奎斯特频率，第 17 课只取到 8000。
    b = librosa.filters.mel(sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS, fmax=FMAX)
    compare("② 加上 fmax=8000", b, f"库默认 fmax = sr/2 = {SR / 2:.0f}")

    # 差别二：归一化。库默认把每个三角形缩成等面积，手写那版顶点是 1。
    b = librosa.filters.mel(sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS,
                            fmax=FMAX, norm=None)
    compare("③ 再加上 norm=None", b, "库默认 norm='slaney'，三角形面积归一")

    # 差别三：用的根本不是同一条梅尔公式。
    b = librosa.filters.mel(sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS,
                            fmax=FMAX, norm=None, htk=True)
    final = compare("④ 再加上 htk=True", b, "库默认 htk=False，另一条梅尔公式")

    print()
    print("  两条梅尔公式在同样几个频率上给出的数：")
    probe = np.array([100.0, 1000.0, 4000.0, 8000.0])
    slaney = librosa.hz_to_mel(probe, htk=False)
    htk = librosa.hz_to_mel(probe, htk=True)
    mel_rows = []
    for f, s_v, h_v in zip(probe, slaney, htk):
        mel_rows.append({"hz": float(f), "slaney": float(s_v), "htk": float(h_v)})
        print(f"    {f:7.0f} Hz -> HTK {h_v:8.2f} Mel，Slaney {s_v:7.2f} Mel")
    print("  第 17 课那条 2595·log10(1 + f/700) 就是 HTK 那一条；")
    print("  库默认走的是 Slaney 那一条：1000 Hz 以下是直线，之上才转对数。")
    print(f"  三处都改过来之后，最大差只剩 {final['max_diff']:.4f}。")
    print("  这点残差来自第 17 课的第 ④ 步：那里把三角形的三个角四舍五入到了")
    print("  最近的频率格，库则直接用精确频率去算每一格的权重。")
    print()
    return stages, mel_rows, mine


def nb4_melspectrogram(y):
    """cell 11—12：一行拿到梅尔声谱图，并拆开它。"""
    print("[正文] 第 4 步 · melspectrogram 里面到底做了什么")
    mel = librosa.feature.melspectrogram(y=y, sr=SR, n_fft=FRAME_SIZE,
                                         hop_length=HOP_SIZE, n_mels=N_MELS)
    print(f"  librosa.feature.melspectrogram(...) -> {mel.shape}，{mel.dtype}")
    # 手工走一遍那三步
    basis = librosa.filters.mel(sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS)
    power = np.abs(librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)) ** 2
    manual = basis @ power
    diff = float(np.abs(manual - mel).max())
    print(f"  自己走三步：stft -> abs()**2 -> 滤波器组 @ 功率矩阵 -> {manual.shape}")
    print(f"  两者最大差 {diff:.3e}")
    print("  所以那个函数不是黑盒，它就是这三步串起来——第 16、17 课都做过。")
    print(f"  也因此它同时要 STFT 的参数（n_fft、hop_length）和梅尔的参数（n_mels）。")
    print()
    return mel, power, manual, diff


def nb5_power_to_db(mel):
    """cell 13—14：换成 dB，形状不变。"""
    print("[正文] 第 5 步 · 换成分贝")
    default = librosa.power_to_db(mel)
    ref_max = librosa.power_to_db(mel, ref=np.max)
    print(f"  power_to_db(mel)            范围 {default.min():7.2f} 到 {default.max():6.2f} dB")
    print(f"  power_to_db(mel, ref=np.max) 范围 {ref_max.min():7.2f} 到 {ref_max.max():6.2f} dB")
    print(f"  形状都还是 {ref_max.shape}——换算不动形状，只动每一格的数。")
    print("  写 ref=np.max 就是「把最强的那一格定成 0 dB」，其余都是负的。")
    print("  下面那个 -80 又是 top_db=80 截出来的（第 16 课踩过）。")
    print()
    return ref_max, {
        "default_lo": float(default.min()), "default_hi": float(default.max()),
        "refmax_lo": float(ref_max.min()), "refmax_hi": float(ref_max.max()),
    }


def nb6_band_count(y, power):
    """cell 15 之后：带数改一改，图和体积各变多少。"""
    print("[正文] 第 6 步 · 10 个带和 90 个带，差在哪里")
    rows = []
    plots = {}
    for n in (10, 90):
        mel = librosa.feature.melspectrogram(y=y, sr=SR, n_fft=FRAME_SIZE,
                                             hop_length=HOP_SIZE, n_mels=n)
        db = librosa.power_to_db(mel, ref=np.max)
        rows.append({"n_mels": n, "shape": list(mel.shape),
                     "bytes": int(mel.nbytes),
                     "vs_power": float(power.nbytes / mel.nbytes)})
        plots[n] = db
        print(f"  n_mels={n:3d} -> {str(mel.shape):10s} "
              f"{mel.nbytes:7d} 字节，是功率矩阵的 1/{power.nbytes / mel.nbytes:.1f}")
    print(f"  功率矩阵本身 {power.shape} 是 {power.nbytes} 字节。")
    print("  10 个带画出来是十条粗台阶，看得出音在往上走，看不出别的；")
    print("  90 个带画出来能看见主音上面那几条平行的泛音线。")
    print()
    return rows, plots


def extra_not_only_for_humans():
    """正文没放：梅尔刻度是照着人耳拟合的，换个耳朵就该换把尺子。"""
    print("[脚本额外] 这把尺子只对人有效")
    print("  梅尔刻度是从人的听觉实验里拟合出来的。分析海豚的超声或蝙蝠的回声时，")
    print("  它没有任何道理可讲——那时该按那种动物的听觉重新造一组滤波器。")
    print("  换句话说，n_mels、fmin、fmax 这些参数不是「调参」，")
    print("  它们在回答「这段声音是给谁听的」。")
    print()


def dump_figures(stages, mel_rows, mine, mel, power, manual, diff,
                 db_stats, band_rows, plots):
    bin_hz = SR / FRAME_SIZE
    n_show = 1025  # 三角形只画到 8000 Hz 附近
    keep = int(FMAX / bin_hz) + 4
    payload = {
        "sr": SR, "frame_size": FRAME_SIZE, "hop_size": HOP_SIZE,
        "n_mels": N_MELS, "fmax": FMAX, "fmin": 0.0, "bin_hz": bin_hz,
        "stages": stages,
        "mel_formula": mel_rows,
        "curves": {
            "mine": [[round(float(v), 4) for v in row[:keep]] for row in mine],
            "default": [[round(float(v), 6) for v in row[:keep]]
                        for row in librosa.filters.mel(
                            sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS)],
            "aligned": [[round(float(v), 4) for v in row[:keep]]
                        for row in librosa.filters.mel(
                            sr=SR, n_fft=FRAME_SIZE, n_mels=N_MELS,
                            fmax=FMAX, norm=None, htk=True)],
        },
        "blackbox": {
            "power_shape": list(power.shape), "mel_shape": list(mel.shape),
            "max_diff": diff,
        },
        "db": db_stats,
        "bands": band_rows,
        "band_plots": {
            str(n): _plot(db, n, len(mel[0]))
            for n, db in plots.items()
        },
    }
    print(f"[配图数据] 写好了 {dump(18, payload)}")


def _plot(db, n_mels, frames):
    """整数化的 dB，和第 16、17 课同一套省体积的做法。"""
    q = np.clip(np.round(db), -80, 0).astype(int) + 80
    return {
        "sampleRate": SR, "hop": HOP_SIZE, "bins": int(db.shape[0]),
        "frames": int(db.shape[1]), "freqs": list(range(int(db.shape[0]))),
        "dbFloorStored": -80, "dbq": [int(v) for v in q.T.ravel()],
        "duration": float(frames * HOP_SIZE / SR),
    }


if __name__ == "__main__":
    print(f"采样率 {SR}，帧长 {FRAME_SIZE}，帧移 {HOP_SIZE}，梅尔带 {N_MELS}\n")
    y = nb1_load()
    default_bank = nb2_filter_bank()
    stages, mel_rows, mine = nb3_align(default_bank)
    mel, power, manual, diff = nb4_melspectrogram(y)
    db, db_stats = nb5_power_to_db(mel)
    band_rows, plots = nb6_band_count(y, power)
    extra_not_only_for_humans()
    if "--dump" in sys.argv:
        dump_figures(stages, mel_rows, mine, mel, power, manual, diff,
                     db_stats, band_rows, plots)

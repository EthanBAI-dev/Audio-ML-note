# -*- coding: utf-8 -*-
"""第 17 课 · 梅尔刻度与三角滤波器组。

跑法（在 project/ 目录下）：
    python lessons/lesson17_mel_scale.py
    python lessons/lesson17_mel_scale.py --dump

对应 source_course/17 - Mel Spectrogram Explained Easily/
Mel Spectrograms Explained Easily.pdf。

源材料的顺序是：心理声学实验（同样约 200 Hz，一个像跨了两个八度、一个像跨了
一个全音）→ 人对频率的感知是对数的 → 理想的音频特征要三样：时频表示、感知
上合理的幅度、感知上合理的频率 → 梅尔刻度（刻度上等距 = 听感上等距，
1000 Hz = 1000 Mel）→ 提取配方 → 选多少个梅尔带 → 造三角滤波器组的五步 →
滤波器组形状 (带数, 帧长/2+1) → 乘上声谱图得到 (带数, 帧数)。

**这一课不调 librosa 的梅尔函数。** 滤波器组按那五步自己造一遍，形状和数字
都自己算出来；和库的结果对齐是第 18 课的事，那一课才有对照的价值。
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
N_MELS = 10          # 和第 18 课的那次调用取同一个数，方便下一课直接对照
FMIN = 0.0
FMAX = 8000.0

# 心理声学实验里那两对音（p5）
PAIRS = [
    ("C2", 65.41, "C4", 261.63),
    ("G6", 1567.98, "A6", 1760.00),
]


def hz_to_mel(f):
    """标准公式。斜率在低频陡、在高频缓，正是「低频分得细」的来源。"""
    return 2595.0 * np.log10(1.0 + np.asarray(f, dtype=float) / 700.0)


def mel_to_hz(m):
    return 700.0 * (10.0 ** (np.asarray(m, dtype=float) / 2595.0) - 1.0)


def step1_experiment():
    """p5：同样约 200 Hz，听起来差得远不是一回事。"""
    print("[正文] 第 1 步 · 同样差 200 Hz，听起来完全不是一回事")
    rows = []
    for lo_name, lo, hi_name, hi in PAIRS:
        gap_hz = hi - lo
        semitones = 12 * np.log2(hi / lo)
        gap_mel = float(hz_to_mel(hi) - hz_to_mel(lo))
        rows.append({
            "low_name": lo_name, "low_hz": lo,
            "high_name": hi_name, "high_hz": hi,
            "gap_hz": gap_hz, "semitones": float(semitones), "gap_mel": gap_mel,
        })
        print(f"  {lo_name}({lo:7.2f} Hz) -> {hi_name}({hi:7.2f} Hz)")
        print(f"    赫兹上差 {gap_hz:6.2f} Hz，音程上差 {semitones:5.2f} 个半音")
    ratio_hz = rows[0]["gap_hz"] / rows[1]["gap_hz"]
    ratio_semi = rows[0]["semitones"] / rows[1]["semitones"]
    print(f"  两对在赫兹上几乎一样（差 {ratio_hz:.2f} 倍），")
    print(f"  在音程上差 {ratio_semi:.0f} 倍——一个跨两个八度，一个只跨一个全音。")
    print("  所以「差多少赫兹」根本不等于「听起来差多远」。")
    print()
    return rows, float(ratio_hz), float(ratio_semi)


def step2_mel_scale():
    """p11/p12：梅尔刻度长什么样，1000 Hz 那个锚点对不对。"""
    print("[正文] 第 2 步 · 梅尔刻度：刻度上等距，听起来才等距")
    anchor = float(hz_to_mel(1000.0))
    print(f"  公式 m = 2595 · log10(1 + f / 700)")
    print(f"  1000 Hz -> {anchor:.2f} Mel（刻度就是按这个点定的，"
          f"2595 这个常数让它落在 1000 附近）")
    print(f"  往回换 {anchor:.2f} Mel -> {float(mel_to_hz(anchor)):.2f} Hz，对得上")
    # 把 0—8000 Hz 在梅尔上均分十段，看切回赫兹之后每段有多宽
    edges_mel = np.linspace(hz_to_mel(FMIN), hz_to_mel(FMAX), 11)
    edges_hz = mel_to_hz(edges_mel)
    widths = np.diff(edges_hz)
    print(f"  把 0—{FMAX:.0f} Hz 在梅尔刻度上均分成 10 段，切回赫兹是：")
    for i, (a, b) in enumerate(zip(edges_hz[:-1], edges_hz[1:])):
        print(f"    第 {i + 1:2d} 段 {a:7.1f} — {b:7.1f} Hz，宽 {b - a:6.1f} Hz")
    print(f"  最窄的一段 {widths.min():.1f} Hz，最宽的 {widths.max():.1f} Hz，"
          f"差 {widths.max() / widths.min():.1f} 倍。")
    print("  梅尔上每段一样长，赫兹上却越往高越宽——低频分得细，高频分得粗。")
    print()
    return {"anchor_mel": anchor,
            "edges_mel": [float(v) for v in edges_mel],
            "edges_hz": [float(v) for v in edges_hz],
            "widths": [float(v) for v in widths],
            "width_ratio": float(widths.max() / widths.min())}


def step3_experiment_in_mel(rows):
    """把第 1 步那两对音换成梅尔再量一次——这是梅尔刻度的验收。"""
    print("[正文] 第 3 步 · 用梅尔量一遍刚才那两对音")
    for r in rows:
        print(f"  {r['low_name']} -> {r['high_name']}："
              f"赫兹差 {r['gap_hz']:6.2f}，梅尔差 {r['gap_mel']:7.2f}")
    ratio = rows[0]["gap_mel"] / rows[1]["gap_mel"]
    print(f"  赫兹上两对几乎一样，梅尔上差了 {ratio:.1f} 倍。")
    print(f"  而它们在音程上差 {rows[0]['semitones'] / rows[1]['semitones']:.0f} 倍。")
    print("  梅尔没有完全对上音程，但方向对了：听起来远的，在梅尔上也远。")
    print()
    return float(ratio)


def step4_filter_bank():
    """p25/p29/p31：按五步造滤波器组。"""
    print("[正文] 第 4 步 · 按五步造三角滤波器组")
    n_bins = FRAME_SIZE // 2 + 1
    bin_hz = SR / FRAME_SIZE
    print(f"  一帧 {FRAME_SIZE} 个样本 -> {n_bins} 个频率格，每格 {bin_hz:.2f} Hz")

    # 1. 最低最高频率转成梅尔
    mel_lo, mel_hi = float(hz_to_mel(FMIN)), float(hz_to_mel(FMAX))
    print(f"  ① {FMIN:.0f} Hz -> {mel_lo:.2f} Mel，{FMAX:.0f} Hz -> {mel_hi:.2f} Mel")
    # 2. 在梅尔上取 n_mels + 2 个等距点
    points_mel = np.linspace(mel_lo, mel_hi, N_MELS + 2)
    print(f"  ② 在梅尔上等距取 {N_MELS} + 2 = {N_MELS + 2} 个点"
          f"（每个三角形要用到三个点：左脚、顶、右脚）")
    # 3. 转回赫兹
    points_hz = mel_to_hz(points_mel)
    print(f"  ③ 转回赫兹：" + "、".join(f"{v:.0f}" for v in points_hz))
    # 4. 取整到最近的频率格
    points_bin = np.round(points_hz / bin_hz).astype(int)
    print(f"  ④ 取整到最近的频率格：" + "、".join(str(v) for v in points_bin))
    # 5. 造三角形
    bank = np.zeros((N_MELS, n_bins))
    for i in range(N_MELS):
        left, peak, right = points_bin[i], points_bin[i + 1], points_bin[i + 2]
        for k in range(left, peak):
            if peak > left:
                bank[i, k] = (k - left) / (peak - left)
        for k in range(peak, right):
            if right > peak:
                bank[i, k] = (right - k) / (right - peak)
    print(f"  ⑤ 每三个点造一个三角形，得到 {bank.shape} 的滤波器组")
    print(f"  形状就是（带数，帧长 / 2 + 1）= ({N_MELS}, {n_bins})")

    widths_hz = [(points_bin[i + 2] - points_bin[i]) * bin_hz for i in range(N_MELS)]
    print(f"  第 1 个三角形底边宽 {widths_hz[0]:.0f} Hz，"
          f"第 {N_MELS} 个宽 {widths_hz[-1]:.0f} Hz，"
          f"差 {widths_hz[-1] / widths_hz[0]:.1f} 倍")
    print("  低频那些又窄又挤，高频那些又宽又疏——这正是梅尔刻度的形状。")
    print("  （这里的三角形顶点都是 1。库里默认还会把每个三角形缩成等面积，")
    print("   那是第 18 课对齐时要处理的差别。）")
    print()
    return bank, {
        "n_bins": n_bins, "bin_hz": bin_hz, "n_mels": N_MELS,
        "mel_lo": mel_lo, "mel_hi": mel_hi,
        "points_mel": [float(v) for v in points_mel],
        "points_hz": [float(v) for v in points_hz],
        "points_bin": [int(v) for v in points_bin],
        "widths_hz": [float(v) for v in widths_hz],
        "width_ratio": float(widths_hz[-1] / widths_hz[0]),
    }


def step5_apply(bank):
    """p34/p37：把滤波器组乘到声谱图上。"""
    print("[正文] 第 5 步 · 乘上去，1025 行压成 10 行")
    y, sr = io.load("scale")
    S = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
    Y = np.abs(S) ** 2
    mel = bank @ Y
    print(f"  声谱图 Y     {Y.shape}   （频率格，帧）")
    print(f"  滤波器组 M   {bank.shape}   （带，频率格）")
    print(f"  M @ Y      {mel.shape}   （带，帧）")
    print(f"  行数从 {Y.shape[0]} 压到 {mel.shape[0]}，少了 "
          f"{Y.shape[0] / mel.shape[0]:.1f} 倍；列数一个没动。")
    print("  每一行就是「这一带覆盖的那些频率格，按三角形加权求和」。")
    print("  时间轴完全没碰，被换掉的只有频率轴。")
    print()
    return Y, mel


def step6_how_many_bands():
    """p17—p22：多少个梅尔带？看问题而定。"""
    print("[正文] 第 6 步 · 要多少个梅尔带")
    n_bins = FRAME_SIZE // 2 + 1
    rows = []
    for n in [10, 40, 90, 128]:
        pts = mel_to_hz(np.linspace(hz_to_mel(FMIN), hz_to_mel(FMAX), n + 2))
        centers = pts[1:-1]
        first = float(centers[1] - centers[0])
        last = float(centers[-1] - centers[-2])
        rows.append({"n_mels": n, "rows_after": n,
                     "compress": n_bins / n,
                     "first_gap": first, "last_gap": last})
        print(f"  {n:3d} 个带：{n_bins} 行压成 {n:3d} 行（{n_bins / n:5.1f} 倍），"
              f"最低两个带中心相距 {first:6.1f} Hz，最高两个相距 {last:6.1f} Hz")
    print("  带越多，保留的频率细节越多，交给模型的数也越多。")
    print("  取多少没有标准答案——分辨乐器和分辨曲风要的细致程度并不一样。")
    print()
    return rows


def extra_why_not_pure_log():
    """正文没放：为什么不直接用 log(f)，非要多个 700。"""
    print("[脚本额外] 为什么不直接取对数")
    for f in [10.0, 50.0, 100.0, 700.0, 5000.0]:
        print(f"  {f:7.1f} Hz -> 梅尔 {float(hz_to_mel(f)):8.2f}，"
              f"纯对数 log10 = {np.log10(f):5.2f}")
    print("  纯对数在 f 趋近 0 时掉向负无穷，低频那一段没法用。")
    print("  加上 700 之后，低频那一段接近直线、高频那一段才弯成对数——")
    print("  这也符合听感：几十赫兹上下的差别，人本来就分不太出来。")
    print()


def dump_figures(rows, ratio_hz, ratio_semi, scale, mel_ratio, bank, bank_info,
                 Y, mel, bands):
    n_show = 260
    step = max(1, mel.shape[1] // n_show)
    payload = {
        "sr": SR, "frame_size": FRAME_SIZE, "hop_size": HOP_SIZE,
        "fmin": FMIN, "fmax": FMAX, "n_mels": N_MELS,
        "pairs": rows, "ratio_hz": ratio_hz, "ratio_semitones": ratio_semi,
        "mel_ratio": mel_ratio,
        "scale": scale,
        "curve_hz": [float(v) for v in np.linspace(0, FMAX, 240)],
        "curve_mel": [float(v) for v in hz_to_mel(np.linspace(0, FMAX, 240))],
        "bank": bank_info,
        "bank_curves": [[round(float(v), 4) for v in row[:bank_info["points_bin"][-1] + 2]]
                        for row in bank],
        "apply": {
            "spectrogram_shape": list(Y.shape),
            "bank_shape": list(bank.shape),
            "mel_shape": list(mel.shape),
            "compress": float(Y.shape[0] / mel.shape[0]),
            # 梅尔声谱图本身也上一张图。纵轴是「第几个带」而不是赫兹——
            # 每个带在图上一样高，这正是换掉频率轴之后的样子。
            "plot": {
                "sampleRate": SR, "hop": HOP_SIZE,
                "bins": int(mel.shape[0]),
                "frames": int(mel[:, ::step].shape[1]),
                "freqs": list(range(int(mel.shape[0]))),
                "dbFloorStored": -80,
                "dbq": _quantise(mel[:, ::step]),
                "duration": float(Y.shape[1] * HOP_SIZE / SR),
            },
            "band_centers": [float(v) for v in bank_info["points_hz"][1:-1]],
            "duration": float(Y.shape[1] * HOP_SIZE / SR),
        },
        "bands": bands,
    }
    print(f"[配图数据] 写好了 {dump(17, payload)}")


def _quantise(m, floor=-80):
    """整数化的 dB，理由和第 16 课一样：省体积，画出来看不出区别。"""
    peak = max(float(np.max(m)), 1e-12)
    db = 10 * np.log10(np.maximum(m, 1e-12) / peak)
    q = np.clip(np.round(db), floor, 0).astype(int) - floor
    return [int(v) for v in q.T.ravel()]


if __name__ == "__main__":
    print(f"采样率 {SR}，帧长 {FRAME_SIZE}，帧移 {HOP_SIZE}，"
          f"梅尔带 {N_MELS}，频率范围 {FMIN:.0f}—{FMAX:.0f} Hz\n")
    pair_rows, r_hz, r_semi = step1_experiment()
    scale_info = step2_mel_scale()
    mel_ratio = step3_experiment_in_mel(pair_rows)
    bank, bank_info = step4_filter_bank()
    Y, mel = step5_apply(bank)
    bands = step6_how_many_bands()
    extra_why_not_pure_log()
    if "--dump" in sys.argv:
        dump_figures(pair_rows, r_hz, r_semi, scale_info, mel_ratio,
                     bank, bank_info, Y, mel, bands)

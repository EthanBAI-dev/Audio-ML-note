# -*- coding: utf-8 -*-
"""第 20 课 · 用 Python 取 MFCC，并和第 19 课手写的那套对齐。

跑法（在 project/ 目录下）：
    python lessons/lesson20_mfcc.py
    python lessons/lesson20_mfcc.py --dump

对应 source_course/20 - Extracting MFCCs with Python/Extracting MFCCs.ipynb。

Notebook 的顺序是：载入 debussy → librosa.feature.mfcc(n_mfcc=13) →
看 shape → 画图 → librosa.feature.delta → order=2 → 各自画图 →
np.concatenate 拼成 39 行 → 看 shape。

十八格里有六格是 `.shape`。Notebook 打印完形状就翻篇了，所以这一课要多做
三件事：**把这一行库函数拆回第 19 课手写的那四步逐位对齐**；**证明 delta
是沿时间轴而不是沿系数轴**；**看看这 13 个数到底分不分得开三种风格**。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa
from scipy.fftpack import dct

from soundlab import io
from soundlab.config import SR
from soundlab.figdata import dump

N_FFT = 2048
HOP = 512
N_MFCC = 13
SECONDS = 30.0            # 三段音乐都只取前 30 秒，长度一致才好比
POKE_FRAME = 200          # 扰动实验改哪一帧
GENRES = ("debussy", "redhot", "duke")


# ------------------------------------------------------- Notebook cell 1—5
def nb1_load():
    print("[正文] 第 1 步 · 载入源 Notebook 用的那段音乐")
    y, sr = io.load("debussy", seconds=SECONDS)
    print(f"  debussy.wav 前 {SECONDS:.0f} 秒：{len(y)} 个样本，采样率 {sr} Hz")
    print(f"  {len(y)} / {sr} = {len(y) / sr:.2f} 秒")
    print("  librosa.load 不写 sr 就默认重采样到 22050——全课程一直用的就是这个数，")
    print("  所以这里读进来的采样率和前面十九课完全一致，特征可以互相比较。")
    print()
    return y, sr


# ------------------------------------------------------- Notebook cell 6—8
def nb2_one_line(y, sr):
    print("[正文] 第 2 步 · 一行拿到 13 个系数")
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC,
                                 n_fft=N_FFT, hop_length=HOP)
    n_frames = 1 + len(y) // HOP
    print(f"  librosa.feature.mfcc(y, sr, n_mfcc={N_MFCC}) -> {mfccs.shape}")
    print(f"  {mfccs.shape[0]} 行是系数序号 0—{N_MFCC - 1}，"
          f"{mfccs.shape[1]} 列是帧。")
    print(f"  帧数按第 15 课的算式：1 + {len(y)} // {HOP} = {n_frames}，对得上。")
    print(f"  一帧覆盖 {N_FFT / sr * 1000:.1f} 毫秒，"
          f"每 {HOP / sr * 1000:.1f} 毫秒挪一次。")
    print(f"  数值范围 {mfccs.min():.1f} 到 {mfccs.max():.1f}——**这不是分贝**。")
    print("  分贝停在 power_to_db 那一步，DCT 之后的系数没有单位。")
    print()
    return mfccs, n_frames


# ---------------------------------------------------- 编辑补充：把那一行拆开
def three_steps(y, sr, n_mels, fmax=None, norm="slaney", htk=False,
                top_db=80.0):
    """第 19 课手写的那三步：梅尔谱 → 取对数 → DCT，然后取前 13 行。"""
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=N_FFT,
                                         hop_length=HOP, n_mels=n_mels,
                                         fmax=fmax, norm=norm, htk=htk)
    L = librosa.power_to_db(mel, top_db=top_db)
    return dct(L, axis=0, type=2, norm="ortho")[:N_MFCC], L


def nb3_align(y, sr, mfccs):
    """照第 18 课那张四阶段表：逐个改默认值，每次重量一次最大差。

    起点不是随便挑的。**第 18 课为了对上第 17 课手写的滤波器组，读者亲手把
    三个默认值改掉了**（fmax=8000、norm=None、htk=True）。所以这一课的起点
    就是那套设定，加上第 19 课一直在用的 40 条梅尔带。
    """
    print("[正文] 第 3 步 · 那一行到底等于哪几步")
    print("  库里那一行拆开是四步：")
    print("    ① melspectrogram(y, sr)          梅尔谱      —— 第 18 课")
    print("    ② power_to_db(...)               取对数      —— 第 18 课")
    print("    ③ dct(..., type=2, norm='ortho') 再变换一次  —— 第 19 课")
    print("    ④ [:n_mfcc]                      取前 13 行  —— 第 19 课")
    print("  四步全是前两课手写过的。既然如此，自己走一遍应该得到同一批数。")
    print()

    stages = [
        ("第 17—19 课手写那套（40 带、fmax=8000、norm=None、htk=True）",
         dict(n_mels=40, fmax=8000.0, norm=None, htk=True), "起点"),
        ("把 htk 改回 False", dict(n_mels=40, fmax=8000.0, norm=None,
                                   htk=False), "htk"),
        ("把 norm 改回 'slaney'", dict(n_mels=40, fmax=8000.0,
                                       norm="slaney", htk=False), "norm"),
        ("去掉 fmax（默认到 sr/2）", dict(n_mels=40, fmax=None,
                                          norm="slaney", htk=False), "fmax"),
        ("把梅尔带数改成 128", dict(n_mels=128, fmax=None, norm="slaney",
                                    htk=False), "n_mels"),
    ]
    rows = []
    print(f"  {'这一步':46}{'和库的最大差':>14}")
    for label, kw, key in stages:
        mine, _ = three_steps(y, sr, **kw)
        diff = float(np.abs(mine - mfccs).max())
        rows.append({"label": label, "param": key, "diff": diff,
                     "n_mels": kw["n_mels"]})
        print(f"  {label:46}{diff:14.4f}")
    print()
    only_mels, _ = three_steps(y, sr, n_mels=128, fmax=8000.0, norm=None,
                               htk=True)
    only_diff = float(np.abs(only_mels - mfccs).max())
    print(f"  最后一步一下子归零，是不是只要改 n_mels 就够了？不是。")
    print(f"  从起点只改 n_mels、别的三个不动，最大差还有 {only_diff:.4f}——"
          "四个都得对。")
    print(f"  但 n_mels 是里面最要命的：库默认切 128 条梅尔带，第 19 课用的是 40 条。")
    print("  DCT 的输入根数都不一样，输出的前 13 个系数当然对不上——")
    print("  这不是精度问题，是**原料不同**。四个全改对之后最大差 "
          f"{rows[-1]['diff']:.3e}，逐位相同。")
    print("  第 18 课改那三个默认值，是为了让库去对齐手写的滤波器组；")
    print("  这一课反过来，是让手写的去对齐库。**对齐的方向取决于谁当基准。**")
    print()
    rows.append({"label": "只改 n_mels、其余不动（对照）", "param": "only",
                 "diff": only_diff, "n_mels": 128})
    return rows


def nb3b_top_db(y, sr, mfccs):
    """power_to_db 的 top_db=80 是个暗桩：它按整段最大值截断。"""
    print("[正文] 第 3 步续 · 还有一个不写出来就看不见的默认值")
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=N_FFT,
                                         hop_length=HOP, n_mels=128)
    full = librosa.power_to_db(mel, top_db=None)
    clipped = librosa.power_to_db(mel)          # top_db=80
    n_clip = int((full < full.max() - 80.0).sum())
    ratio = n_clip / full.size
    mine, _ = three_steps(y, sr, n_mels=128, top_db=None)
    diff = float(np.abs(mine - mfccs).max())
    print(f"  power_to_db 默认 top_db=80：比整段最高点低 80 dB 以下的，全部抬到 −80。")
    print(f"  这段音乐里真实跨度是 {full.max() - full.min():.1f} dB，"
          f"被抬上来的格子有 {n_clip} 个，占 {ratio:.2%}。")
    print(f"  只要把 top_db 关掉，自己算的 MFCC 和库就又差 {diff:.4f}。")
    print(f"  {ratio:.2%} 的格子改变了 13 个系数里的每一个——因为 DCT 是把"
          "整列一起变换的，")
    print("  一列里改动任何一个数，这一列的 13 个系数全都会跟着动。")
    print()
    return {"span": float(full.max() - full.min()), "n_clip": n_clip,
            "ratio": ratio, "diff_no_topdb": diff,
            "floor": float(full.max() - 80.0), "min": float(full.min())}


# ---------------------------------------------------- Notebook cell 11—16
def nb4_delta(mfccs):
    print("[正文] 第 4 步 · 一阶差分与二阶差分")
    d1 = librosa.feature.delta(mfccs)
    d2 = librosa.feature.delta(mfccs, order=2)
    print(f"  librosa.feature.delta(mfccs)          -> {d1.shape}")
    print(f"  librosa.feature.delta(mfccs, order=2) -> {d2.shape}")
    print("  行数列数都没变：每一帧的 13 个系数，各自多了一个变化率。")
    print()

    print("[正文] 第 4 步续 · 它是沿时间轴差分的，不是沿系数轴")
    print(f"  做个实验：只把第 {POKE_FRAME} 帧那一列整体加 10，别的地方一个字不动。")
    poked = mfccs.copy()
    poked[:, POKE_FRAME] += 10.0
    touched = {}
    for name, key, kw in (("沿时间轴（默认 axis=-1）", "time", dict()),
                          ("沿系数轴（axis=0）", "coef", dict(axis=0))):
        a = librosa.feature.delta(mfccs, **kw)
        b = librosa.feature.delta(poked, **kw)
        cols = np.where(np.abs(a - b).max(axis=0) > 1e-6)[0]
        touched[key] = [int(v) for v in cols]
        span = f"{cols.min()}—{cols.max()}" if len(cols) else "无"
        print(f"  {name:24}变了 {len(cols):2d} 列（第 {span} 列）")
    print(f"  影响摊开在第 {POKE_FRAME - 4} 到第 {POKE_FRAME + 4} 这 9 列上，"
          f"但真正变了的只有 {len(touched['time'])} 列——")
    print(f"  **正中间的第 {POKE_FRAME} 列纹丝不动。** 因为这个斜率是"
          "「右边四帧减左边四帧」，")
    print("  被改的那一帧自己的权重正好是 0：一帧的 delta 完全不取决于它自己。")
    print("  librosa.feature.delta 默认 width=9：它不是拿相邻两帧相减，")
    print("  而是把连续九帧摆在一起拟合一条直线，取那条直线的斜率。")
    print("  沿系数轴那一行只变了 1 列，说明默认方向确实是时间，不是系数序号。")
    print()

    print("[正文] 第 4 步续 · 那它和「后一帧减前一帧」差多少")
    naive = np.diff(mfccs, axis=1, prepend=mfccs[:, :1])
    corr = float(np.mean([np.corrcoef(d1[i], naive[i])[0, 1]
                          for i in range(N_MFCC)]))
    ratio = float(np.std(d1) / np.std(naive))
    print(f"  两者逐行相关系数平均 {corr:.4f}，方向是一致的。")
    print(f"  但幅度只有 {ratio:.2f} 倍：九帧一起看，孤立的抖动被摊平了。")
    print("  窗口左右对称，所以估出来的斜率对准的还是中间那一帧，不会偏。")
    print()
    return d1, d2, {
        "poke": POKE_FRAME, "corr": corr, "ratio": ratio,
        "width": 9, "touched_time": touched["time"],
        "touched_coef": touched["coef"],
    }


# ---------------------------------------------------- Notebook cell 17—18
def nb5_concat(mfccs, d1, d2):
    print("[正文] 第 5 步 · 拼成每帧 39 个数")
    feats = np.concatenate((mfccs, d1, d2))
    print(f"  np.concatenate((mfccs, delta, delta2)) -> {feats.shape}")
    print(f"  13 + 13 + 13 = {feats.shape[0]}。")
    print(f"  **是每一帧 39 个数，不是整段 39 个数。** 这段 {SECONDS:.0f} 秒的音乐"
          f"一共 {feats.shape[1]} 帧，")
    print(f"  所以矩阵里有 {feats.size} 个数。")
    print("  前 13 行说这一帧的谱包络长什么样，中间 13 行说它在往哪个方向变，")
    print("  后 13 行说这个变化本身在加快还是放慢。")
    print()
    return feats


# ------------------------------------------------------------- 编辑补充
def nb6_three_genres():
    print("[正文] 第 6 步 · 这 13 个数分得开三种风格吗")
    table, means, stds = {}, {}, {}
    for g in GENRES:
        y, sr = io.load(g, seconds=SECONDS)
        m = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC,
                                 n_fft=N_FFT, hop_length=HOP)
        table[g] = m
        means[g] = m.mean(axis=1)
        stds[g] = m.std(axis=1)
    print(f"  三段各取前 {SECONDS:.0f} 秒，每段 {table[GENRES[0]].shape[1]} 帧。")
    print(f"  {'系数':>4}{'debussy':>20}{'redhot':>20}{'duke':>20}"
          f"{'最难分的一对':>14}")
    rows = []
    for i in range(N_MFCC):
        pairs = []
        for a in range(3):
            for b in range(a + 1, 3):
                ga, gb = GENRES[a], GENRES[b]
                gap = abs(means[ga][i] - means[gb][i])
                sep = gap / (stds[ga][i] + stds[gb][i])
                pairs.append(sep)
        worst = float(min(pairs))
        rows.append({
            "i": i, "worst": worst,
            "mean": {g: float(means[g][i]) for g in GENRES},
            "std": {g: float(stds[g][i]) for g in GENRES},
        })
        cells = "".join(f"{means[g][i]:>12.1f} ±{stds[g][i]:<7.1f}"
                        for g in GENRES)
        print(f"  {i:>4}{cells}{worst:>14.2f}")
    print("  最后一列是「最难分的那一对，中心差了几个标准差」——"
          "越大越分得开。")
    best = max(rows, key=lambda r: r["worst"])
    print(f"  最分得开的是第 {best['i']} 个系数，{best['worst']:.2f}；"
          "三对里最挤的那一对也差了这么多个标准差。")
    weak = [r["i"] for r in rows if r["worst"] < 0.2]
    print(f"  但不到 0.2、基本重叠在一起的有 {len(weak)} 个：{weak}。")
    print("  **单看任何一个系数，三种风格都分不干净**——最好的 "
          f"{best['worst']:.2f} 个标准差，")
    print("  离「两堆点不重叠」还差得远。这一点和第 07、09 课是一样的结论。")
    print()

    print("[正文] 第 6 步续 · 那 13 个一起看呢")
    acc = _centroid_acc(table, list(range(N_MFCC)))
    acc_best = _centroid_acc(table, [best["i"]])
    acc_top4 = _centroid_acc(table, [r["i"] for r in
                                     sorted(rows, key=lambda r: -r["worst"])
                                     [:4]])
    print("  拿最笨的办法验一下：每种风格算一个 13 维的中心，"
          "再把每一帧判给最近的那个中心。")
    print(f"    只用第 {best['i']} 个系数     判对 {acc_best:.1%}")
    print(f"    用最分得开的 4 个系数  判对 {acc_top4:.1%}")
    print(f"    13 个一起用          判对 {acc:.1%}")
    print("  三种风格随便猜是 33.3%。这不是一个正经的分类器——没有分训练集，"
          "也没调任何参数——")
    print("  它只说明一件事：**这些数放在一起，比其中任何一个都强得多**"
          f"（{acc_best:.1%} → {acc:.1%}）。")
    print(f"  还有一件值得注意的：挑出来的 4 个（{acc_top4:.1%}）比 13 个全用"
          f"（{acc:.1%}）还高一点。")
    print("  那 7 个基本重叠的系数对这个笨办法只是噪声。**特征多不等于分得更开**——")
    print("  第 07、09 课得到的也是这个结论，只是这里的差距大得多。")
    print()
    return table, rows, {"all": acc, "best_one": acc_best,
                         "top4": acc_top4, "best_i": best["i"],
                         "weak": weak}


def _centroid_acc(table, idx):
    """最近中心法：每种风格一个中心，每一帧判给最近的那个。

    先按每一维的整体标准差缩放，否则第 0 个系数的量级会盖过其余十二个。
    """
    idx = np.asarray(idx)
    X = np.concatenate([table[g][idx] for g in GENRES], axis=1)
    scale = X.std(axis=1, keepdims=True)
    scale[scale == 0] = 1.0
    cents = np.stack([(table[g][idx] / scale).mean(axis=1) for g in GENRES])
    right = 0
    total = 0
    for gi, g in enumerate(GENRES):
        Z = (table[g][idx] / scale).T                   # 帧 × 维
        d = ((Z[:, None, :] - cents[None, :, :]) ** 2).sum(axis=2)
        right += int((d.argmin(axis=1) == gi).sum())
        total += Z.shape[0]
    return right / total


def extra_coefficient_zero(y, sr, mfccs):
    """正文放不下：第 0 个系数是什么，为什么很多流水线把它扔掉。"""
    print("[脚本额外] 第 0 个系数装的是什么")
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=N_FFT,
                                         hop_length=HOP, n_mels=128)
    L = librosa.power_to_db(mel)
    col_mean = L.mean(axis=0)
    rms = librosa.feature.rms(y=y, frame_length=N_FFT, hop_length=HOP)[0]
    rms_db = 20 * np.log10(np.maximum(rms, 1e-10))
    n = min(len(col_mean), mfccs.shape[1], len(rms_db))
    c0 = float(np.corrcoef(mfccs[0, :n], col_mean[:n])[0, 1])
    c0_rms = float(np.corrcoef(mfccs[0, :n], rms_db[:n])[0, 1])
    print(f"  DCT 的第 0 项就是整列的和乘一个常数，所以它跟"
          "「这一帧的对数梅尔谱平均有多高」几乎是同一个量：")
    print(f"    第 0 个系数 与 该帧对数梅尔谱均值的相关系数 {c0:.4f}")
    print(f"    第 0 个系数 与 该帧 RMS（dB）的相关系数        {c0_rms:.4f}")
    ratio = float(np.abs(mfccs[0]).mean() / np.abs(mfccs[1:]).mean())
    print(f"  它的绝对值平均是其余十二个的 {ratio:.1f} 倍，画热力图时会把"
          "别的行全压成一个颜色。")
    print("  所以很多流水线会把第 0 行扔掉或单独归一化——它说的是「多响」，"
          "不是「什么音色」。")
    print()
    return {"corr_logmel": c0, "corr_rms": c0_rms, "ratio": ratio}


def extra_lifter(y, sr, mfccs):
    """正文放不下：mfcc 也有 lifter 参数，默认 0 就是不提升。"""
    print("[脚本额外] mfcc 的 lifter 参数默认是 0")
    lifted = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC, n_fft=N_FFT,
                                  hop_length=HOP, lifter=22)
    diff = float(np.abs(lifted - mfccs).max())
    print(f"  lifter=0（默认）就是原样返回；换成 22 之后最大差 {diff:.2f}。")
    print("  它把第 i 个系数乘上 1 + (L/2)·sin(πi/L)，抬高中间那几个系数的权重。")
    print("  这和第 19 课那个「提升」是同一个词的同一件事，只是这里作用在"
          "系数序号上而不是倒频率上。默认关着，知道它存在就行。")
    print()
    return {"diff": diff}


# ------------------------------------------------------------------ 配图
def _pool(M, k=3):
    """时间轴每 k 列并成一列。画板只有几百像素宽，1292 列存进去是浪费。"""
    n = M.shape[1] // k * k
    return M[:, :n].reshape(M.shape[0], n // k, k).mean(axis=2)


def _heat(M, lo=None, hi=None):
    """整数化，省体积。和第 16—18 课同一套做法。"""
    lo = float(M.min()) if lo is None else lo
    hi = float(M.max()) if hi is None else hi
    q = np.clip(np.round((M - lo) / max(hi - lo, 1e-12) * 255), 0, 255)
    return {"rows": int(M.shape[0]), "cols": int(M.shape[1]),
            "lo": round(lo, 2), "hi": round(hi, 2),
            "q": [int(v) for v in q.ravel()]}


def dump_figures(y, sr, mfccs, n_frames, stages, topdb, d1, d2, dstats,
                 feats, genre_rows, genre_acc, zero_stats):
    poked = mfccs.copy()
    poked[:, POKE_FRAME] += 10.0
    d1p = librosa.feature.delta(poked)
    lo, hi = POKE_FRAME - 12, POKE_FRAME + 13
    payload = {
        "sr": sr, "n_fft": N_FFT, "hop": HOP, "n_mfcc": N_MFCC,
        "seconds": SECONDS, "samples": int(len(y)),
        "shape": list(mfccs.shape), "n_frames": n_frames,
        "concat_shape": list(feats.shape),
        "stages": stages,
        "topdb": topdb,
        "map": {
            "mfcc": _heat(_pool(mfccs)),
            "duration": float(mfccs.shape[1] * HOP / sr),
            "row0_ratio": zero_stats["ratio"],
            "norm": _heat(_pool(
                (mfccs - mfccs.mean(axis=1, keepdims=True))
                / mfccs.std(axis=1, keepdims=True)), lo=-2.5, hi=2.5),
            "row_scale": [round(float(v), 2) for v in
                          np.abs(mfccs).mean(axis=1)],
        },
        "poke": {
            "frame": POKE_FRAME, "lo": lo, "hi": hi,
            "mfcc_changed": [round(float(v), 3) for v in
                             np.abs(poked - mfccs).max(axis=0)[lo:hi]],
            "delta_changed": [round(float(v), 3) for v in
                              np.abs(d1p - d1).max(axis=0)[lo:hi]],
            "corr": dstats["corr"], "ratio": dstats["ratio"],
            "width": dstats["width"],
            "touched_time": dstats["touched_time"],
            "touched_coef": dstats["touched_coef"],
        },
        "genres": {
            "names": list(GENRES),
            "rows": [{"i": r["i"], "worst": round(r["worst"], 3),
                      "mean": {g: round(r["mean"][g], 2) for g in GENRES},
                      "std": {g: round(r["std"][g], 2) for g in GENRES}}
                     for r in genre_rows],
            "acc": genre_acc,
        },
        "zero": zero_stats,
    }
    print(f"[配图数据] 写好了 {dump(20, payload)}")


if __name__ == "__main__":
    print(f"采样率 {SR}，帧长 {N_FFT}，帧移 {HOP}，取 {N_MFCC} 个系数\n")
    y, sr = nb1_load()
    mfccs, n_frames = nb2_one_line(y, sr)
    stages = nb3_align(y, sr, mfccs)
    topdb = nb3b_top_db(y, sr, mfccs)
    d1, d2, dstats = nb4_delta(mfccs)
    feats = nb5_concat(mfccs, d1, d2)
    genre_table, genre_rows, genre_acc = nb6_three_genres()
    zero_stats = extra_coefficient_zero(y, sr, mfccs)
    extra_lifter(y, sr, mfccs)
    if "--dump" in sys.argv:
        dump_figures(y, sr, mfccs, n_frames, stages, topdb, d1, d2, dstats,
                     feats, genre_rows, genre_acc, zero_stats)

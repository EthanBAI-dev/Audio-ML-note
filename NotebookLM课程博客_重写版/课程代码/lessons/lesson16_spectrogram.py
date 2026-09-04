# -*- coding: utf-8 -*-
"""第 16 课 · 用 Python 把 STFT 画成声谱图。

跑法（在 project/ 目录下）：
    python lessons/lesson16_spectrogram.py
    python lessons/lesson16_spectrogram.py --dump

对应 source_course/16 - Extracting Spectrograms from Audio with Python/
Extracting Spectrograms from Audio with Python.ipynb。

Notebook 的顺序是：载入 scale / debussy / redhot / duke → 定 FRAME_SIZE 2048、
HOP_SIZE 512 → librosa.stft → 看 shape 和元素类型 → abs(S) ** 2 → 再看一次
shape 和类型 → 画线性声谱图 → power_to_db 画对数幅度 → y_axis="log" 画对数
频率 → 三种风格各画一张。本脚本按这个顺序走，并且每一步都把 Notebook 里
「看一眼就过」的 shape 和 dtype 真的打印出来。

第 15 课手写了 STFT 并留下三个待查项：库默认是否补边、画的是模还是功率、
颜色和纵轴要不要换成对数。这一课把这三个都查掉。
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
NAMES = ["scale", "debussy", "redhot", "duke"]
LABELS = {
    "scale": "音阶",
    "debussy": "德彪西（古典）",
    "redhot": "红辣椒（摇滚）",
    "duke": "艾灵顿公爵（爵士）",
}
# 画图时纵轴看到哪里为止。对数纵轴从这里起步——0 Hz 在对数轴上没有位置。
FMAX = 8000.0
FMIN = 20.0


def nb1_load():
    """cell 3—8：把四段音频读进来。"""
    print("[正文] 第 1 步 · 载入四段声音")
    tracks = {}
    for name in NAMES:
        y, sr = io.load(name)
        tracks[name] = y
        print(f"  {name:8s} {len(y):7d} 个样本，{len(y) / sr:6.2f} 秒，{sr} Hz")
    print("  四段都重采样到同一个采样率，否则频率轴对不上（第 04 课的纪律）。")
    print()
    return tracks


def nb2_stft(y):
    """cell 10—13：算 STFT，看它的形状和元素类型。"""
    print("[正文] 第 2 步 · librosa.stft 交出一个复数矩阵")
    S = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
    S_nopad = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE, center=False)
    rows = FRAME_SIZE // 2 + 1
    full = (len(y) - FRAME_SIZE) // HOP_SIZE + 1
    print(f"  S.shape = {S.shape}，元素类型 {S.dtype}")
    print(f"  行数 = {FRAME_SIZE} // 2 + 1 = {rows}（和第 15 课同一条式子）")
    print(f"  只数完整帧的话是 ({len(y)} - {FRAME_SIZE}) // {HOP_SIZE} + 1 = {full} 帧，")
    print(f"  但 librosa 默认 center=True，在两端各补了半帧，所以列数是 {S.shape[1]}。")
    print(f"  显式写 center=False 得到 {S_nopad.shape}，正好是那 {full} 列。")
    print("  第 15 课留的那个问题到这里有答案了：库默认会补边。")
    print()
    return S, S_nopad, rows, full


def nb3_power(S):
    """cell 15—17：取模再平方，复数矩阵变成实数功率矩阵。"""
    print("[正文] 第 3 步 · abs(S) ** 2 把复数换成功率")
    Y = np.abs(S) ** 2
    print(f"  Y.shape = {Y.shape}，和 S 完全一样——没有丢掉任何一格。")
    print(f"  元素类型从 {S.dtype} 变成 {Y.dtype}：复数没了，只剩一个实数。")
    print(f"  丢掉的是相位。第 12 课量过：只留幅度就拼不回原波形。")
    print(f"  最大功率 {float(Y.max()):.4f}，最小 {float(Y.min()):.3e}")
    print()
    return Y


def nb4_linear_is_unreadable(Y):
    """cell 19—20：先照 Notebook 画一次线性的，看它为什么读不出来。"""
    print("[正文] 第 4 步 · 直接上色的图为什么几乎全黑")
    peak = float(Y.max())
    below_1 = float(np.mean(Y < peak * 1e-2))
    below_01 = float(np.mean(Y < peak * 1e-3))
    median_ratio = float(np.median(Y) / peak)
    # 颜色条从 0 铺到峰值。落在中间那 60% 色阶里的格子有多少？
    mid_share = float(np.mean((Y > peak * 0.2) & (Y < peak * 0.8)))
    span_db = 10 * np.log10(peak / max(float(Y.min()), 1e-30))
    print(f"  低于峰值 1% 的格子占 {below_1 * 100:.2f}%")
    print(f"  低于峰值 0.1% 的格子占 {below_01 * 100:.2f}%")
    print(f"  中位数只有峰值的 {median_ratio:.3e}")
    print(f"  落在中间 60% 色阶里的格子只有 {mid_share * 100:.4f}%")
    print("  颜色是按「占峰值多少」分配的，所以这些格子挤在同一个颜色里。")
    print(f"  最强和最弱差 {span_db:.0f} dB，硬要线性铺色，99% 的地方是同一种黑。")
    print()
    return {"below_1": below_1, "below_01": below_01, "median_ratio": median_ratio,
            "peak": peak, "mid_share": mid_share, "span_db": float(span_db)}


def nb5_power_to_db(Y, linear):
    """cell 22：power_to_db 之后同一批数能看见了。"""
    print("[正文] 第 5 步 · power_to_db 把倍数关系摊开")
    Y_db = librosa.power_to_db(Y)
    lo, hi = float(Y_db.min()), float(Y_db.max())
    span = hi - lo
    print(f"  换算之后的范围：{lo:.2f} dB 到 {hi:.2f} dB，跨度 {span:.2f} dB")
    mid_share = float(np.mean((Y_db > lo + span * 0.2) & (Y_db < lo + span * 0.8)))
    print(f"  落在中间 60% 色阶里的格子有 {mid_share * 100:.2f}%，"
          f"线性上色时只有 {linear['mid_share'] * 100:.4f}%。")
    # 这个 80.00 不是数据本身的跨度，是 librosa 的默认截断。必须说清楚，
    # 否则读者会以为这段录音的动态范围正好是 80 dB。
    raw = librosa.power_to_db(Y, top_db=None)
    raw_lo, raw_hi = float(raw.min()), float(raw.max())
    print(f"  注意这个 {span:.2f} 是 librosa 的默认 top_db=80 截出来的，不是数据本身。")
    print(f"  写 top_db=None 不截断，真实跨度是 {raw_hi - raw_lo:.1f} dB")
    print(f"  （{raw_lo:.1f} 到 {raw_hi:.1f}）。截断把「安静到听不见」的部分推平，")
    print("  好处是颜色不会全被极小值占走，代价是最弱的那部分看不出层次。")
    print("  第 03 课讲过人耳对强弱按倍数感觉；dB 就是把倍数换成加减。")
    print()
    return Y_db, {"lo": lo, "hi": hi, "span": span, "mid_share": mid_share,
                  "raw_lo": raw_lo, "raw_hi": raw_hi,
                  "raw_span": raw_hi - raw_lo, "top_db": 80}


def nb6_log_frequency():
    """cell 24：纵轴换成对数频率，低频那一段才展得开。"""
    print("[正文] 第 6 步 · 纵轴换成对数频率")
    nyquist = SR / 2
    linear_share = 1000.0 / nyquist
    log_share = np.log(1000.0 / FMIN) / np.log(nyquist / FMIN)
    octaves = np.log2(nyquist / FMIN)
    print(f"  线性纵轴上，0—1000 Hz 只占 {linear_share * 100:.2f}% 的高度")
    print(f"  对数纵轴上（{FMIN:.0f} Hz 起算），同一段占 {log_share * 100:.2f}%")
    print(f"  对数纵轴一共装 {octaves:.2f} 个八度，每个八度都是 "
          f"{100 / octaves:.2f}% 的高度")
    # 具体到两个八度：线性轴上高低八度占的高度差得离谱
    low = (130.81 - 65.41) / nyquist
    high = (2093.0 - 1046.5) / nyquist
    print(f"  线性轴上 C2→C3 只占 {low * 100:.2f}%，C6→C7 占 {high * 100:.2f}%，"
          f"差 {high / low:.0f} 倍")
    print("  可音乐里这两段都是一个八度。第 02 课说过音高按倍数走，")
    print("  所以纵轴按倍数刻，音阶才会画成一格一格等高的台阶。")
    print("  （人耳对频率的感觉具体怎么弯，是第 17 课梅尔刻度的事。）")
    print()
    return {"nyquist": nyquist, "linear_share": linear_share,
            "log_share": log_share, "octaves": float(octaves),
            "low_octave": low, "high_octave": high}


def nb7_three_genres(tracks):
    """cell 26：三种风格各画一张对数频率声谱图。"""
    print("[正文] 第 7 步 · 三种风格的音乐各来一张")
    out = []
    for name in ["debussy", "redhot", "duke"]:
        S = librosa.stft(tracks[name], n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
        Y_db = librosa.power_to_db(np.abs(S) ** 2)
        row = {
            "name": name, "label": LABELS[name],
            "shape": list(S.shape),
            "db_lo": float(Y_db.min()), "db_hi": float(Y_db.max()),
        }
        out.append(row)
        print(f"  {LABELS[name]:14s} 矩阵 {S.shape[0]} × {S.shape[1]}，"
              f"dB 范围 {row['db_lo']:7.2f} 到 {row['db_hi']:6.2f}")
    print("  三段都是 30 秒、同一组参数，所以矩阵一样大，可以直接并排比较。")
    print()
    return out


def extra_shape_arithmetic(tracks):
    """正文没放：把 center=True 的列数用一条式子核对一遍。"""
    print("[脚本额外] 补边之后的列数怎么来的")
    for name in NAMES:
        y = tracks[name]
        expected = len(y) // HOP_SIZE + 1
        actual = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE).shape[1]
        print(f"  {name:8s} len // hop + 1 = {expected:5d}，实际 {actual:5d}，"
              f"{'一致' if expected == actual else '不一致'}")
    print("  补边把信号两端各补了 n_fft // 2，于是列数只跟长度和帧移有关。")
    print("  这也意味着第 0 列的中心对准第 0 个样本，时间轴从 0 开始。")
    print()


# ---------------------------------------------------------------- 配图数据


def _pool(matrix, freqs, frames_out, rows_out, log_rows, fmax=FMAX, fmin=FMIN):
    """把（频率格，帧）矩阵压到配图能用的大小。

    两件事一起做：时间方向按最大值合并，频率方向重采样到指定的一组中心频率。
    取最大值而不是平均，是为了不把窄峰抹平——第 15 课那条上升的亮带如果按
    平均压缩，会糊成一片。
    """
    m = np.asarray(matrix, dtype=float)
    n_frames = m.shape[1]
    edges = np.linspace(0, n_frames, frames_out + 1).astype(int)
    cols = [m[:, a:max(b, a + 1)].max(axis=1) for a, b in zip(edges[:-1], edges[1:])]
    m = np.stack(cols, axis=1)

    if log_rows:
        centers = np.geomspace(fmin, fmax, rows_out)
    else:
        centers = np.linspace(0.0, fmax, rows_out)
    out = np.empty((rows_out, m.shape[1]))
    bounds = np.concatenate(([centers[0]], (centers[:-1] + centers[1:]) / 2,
                             [centers[-1]]))
    for i in range(rows_out):
        lo, hi = bounds[i], bounds[i + 1]
        mask = (freqs >= lo) & (freqs <= hi)
        if not np.any(mask):
            idx = int(np.argmin(np.abs(freqs - centers[i])))
            out[i] = m[idx]
        else:
            out[i] = m[mask].max(axis=0)
    return centers, out


DB_FLOOR = -100


def _payload(coefficients, sr, frames_out, rows_out, log_rows, duration):
    """做成画图脚本能直接吃的形状：整数化的 dB，按「帧优先」拉平。

    这里不存原始的模，存「比峰值低多少 dB」并四舍五入成整数，再加 100 变成
    0—100 的正整数。原因是体积：一张 300 × 200 的图就是六万个数，四段音频
    写成小数会让这个 JSON 涨到两三 MB。整数化以后大多数格子是一位数，文件
    小一个量级，而画到屏幕上看不出区别——反正颜色本来就只有 256 级。
    """
    mag = np.abs(np.asarray(coefficients))
    freqs = np.fft.rfftfreq(FRAME_SIZE, d=1 / sr)
    centers, pooled = _pool(mag, freqs, frames_out, rows_out, log_rows)
    peak = max(float(pooled.max()), 1e-12)
    db = 20 * np.log10(np.maximum(pooled, 1e-12) / peak)
    q = np.clip(np.round(db), DB_FLOOR, 0).astype(int) - DB_FLOOR
    return {
        "sampleRate": sr, "hop": HOP_SIZE,
        "freqs": [round(float(v), 2) for v in centers],
        "frames": int(q.shape[1]), "bins": int(q.shape[0]),
        "duration": duration, "dbFloorStored": DB_FLOOR,
        "dbq": [int(v) for v in q.T.ravel()],
    }


def dump_figures(tracks, S, S_nopad, rows, full, power, linear, db_stats,
                 axis, genres):
    scale_len = len(tracks["scale"])
    duration = scale_len / SR
    payload = {
        "frame_size": FRAME_SIZE, "hop_size": HOP_SIZE, "sr": SR,
        "fmax": FMAX, "fmin": FMIN,
        "shape": {
            "samples": scale_len, "duration": duration,
            "rows": rows, "full_frames": full,
            "padded_frames": int(S.shape[1]),
            "nopad_frames": int(S_nopad.shape[1]),
            "complex_dtype": str(S.dtype), "power_dtype": str(power.dtype),
        },
        "linear": linear,
        "db": db_stats,
        "axis": axis,
        "scale_linear": _payload(S, SR, 300, 200, False, duration),
        "scale_log": _payload(S, SR, 300, 200, True, duration),
        "genres": [],
    }
    for row in genres:
        name = row["name"]
        y = tracks[name]
        S_g = librosa.stft(y, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
        payload["genres"].append({
            **row,
            "duration": len(y) / SR,
            "plot": _payload(S_g, SR, 200, 140, True, len(y) / SR),
        })
    print(f"[配图数据] 写好了 {dump(16, payload)}")


if __name__ == "__main__":
    print(f"帧长 {FRAME_SIZE}，帧移 {HOP_SIZE}，采样率 {SR}\n")
    tracks = nb1_load()
    S, S_nopad, rows, full = nb2_stft(tracks["scale"])
    Y = nb3_power(S)
    linear = nb4_linear_is_unreadable(Y)
    Y_db, db_stats = nb5_power_to_db(Y, linear)
    axis = nb6_log_frequency()
    genres = nb7_three_genres(tracks)
    extra_shape_arithmetic(tracks)
    if "--dump" in sys.argv:
        dump_figures(tracks, S, S_nopad, rows, full, Y, linear, db_stats,
                     axis, genres)

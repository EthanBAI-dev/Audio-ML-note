# -*- coding: utf-8 -*-
"""第 09 课 · 均方根和过零率怎么算，以及两个一起看到底强多少。

跑法（在 project/ 目录下）：
    python lessons/lesson09_rms_zcr.py

带 [正文] 的段落是文章里出现过的。最后会把第一版 features.csv 写到当前目录。
"""
import sys
import os
import csv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.config import FRAME_LENGTH, HOP_LENGTH
from soundlab.figdata import dump, thin
from soundlab.config import SR, SPEECH_FRAME_LENGTH, SPEECH_HOP_LENGTH
from soundlab.framing import frame
from soundlab.time_features import (
    amplitude_envelope, rms, zero_crossing_rate, summarize)

N, H = SPEECH_FRAME_LENGTH, SPEECH_HOP_LENGTH     # 400 / 160，18.1 与 7.3 毫秒
CLIPS = [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚"),
         ("voice", "语音"), ("noise", "噪声")]


def nb1_rms_librosa():
    """notebook cell 5–7：先用 librosa 现成的 rms 算一遍。"""
    print("[正文] notebook 第 1 步 · 先用 librosa 现成的算")
    import librosa
    y, sr = io.load("debussy", seconds=3)
    r = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH,
                            hop_length=HOP_LENGTH, center=False)[0]
    print(f"  librosa.feature.rms(frame_length={FRAME_LENGTH}, "
          f"hop_length={HOP_LENGTH}, center=False)")
    print(f"  形状 {r.shape}，前 5 帧 {[round(float(v), 5) for v in r[:5]]}")
    print("  一行就出结果。但它内部到底做了什么，得自己写一遍才知道。")
    print()
    return y, sr, r


def nb2_rms_from_scratch(y, sr, lib_rms):
    """notebook cell 9：从零手写 RMS，然后和 librosa 对齐。

    对齐是这一课最要紧的一步：数值对不上，说明两边对「一帧是哪些样本」
    的理解不一样，后面所有比较都不成立。
    """
    print("[正文] notebook 第 2 步 · 从零手写，再和 librosa 对齐")
    f = frame(y, FRAME_LENGTH, HOP_LENGTH)
    mine = rms(f)
    print(f"  手写的形状 {mine.shape}，librosa 的形状 {lib_rms.shape}")
    n = min(len(mine), len(lib_rms))
    diff = np.abs(mine[:n] - lib_rms[:n])
    print(f"  逐帧最大差 {diff.max():.3e}")
    print(f"  两者是否在浮点误差内一致：{bool(diff.max() < 1e-6)}")
    print("  能对上，说明我们对「第 t 帧是哪 1024 个样本」的理解和 librosa 一致。")
    print("  对不上的话先查两件事：center 是不是都关了，帧长帧移是不是同一对。")
    print()
    return mine


def nb3_zcr_librosa_vs_mine():
    """notebook cell 12–15：ZCR 也走一遍，这次两边对不上。"""
    print("[正文] notebook 第 3 步 · 过零率：这次两边对不上")
    import librosa
    y, sr = io.load("debussy", seconds=3)
    lib = librosa.feature.zero_crossing_rate(
        y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, center=False)[0]
    f = frame(y, FRAME_LENGTH, HOP_LENGTH)
    mine = zero_crossing_rate(f)
    n = min(len(lib), len(mine))
    ratio = float(np.median(mine[:n] / np.maximum(lib[:n], 1e-12)))
    print(f"  librosa 前 5 帧 {[round(float(v), 5) for v in lib[:5]]}")
    print(f"  手写的前 5 帧 {[round(float(v), 5) for v in mine[:5]]}")
    print(f"  两者的比值（中位数）{ratio:.6f}")
    print(f"  理论上应该正好是 K/(K-1) = {FRAME_LENGTH}/{FRAME_LENGTH - 1} = "
          f"{FRAME_LENGTH / (FRAME_LENGTH - 1):.6f}")
    print(f"  对得上：{abs(ratio - FRAME_LENGTH / (FRAME_LENGTH - 1)) < 1e-6}")
    print("  第 07 课手算八个数时就看到了这个差：librosa 除以帧长 K，")
    print("  本课程除以相邻对的个数 K−1。帧长 1024 时差 0.1%，")
    print("  但两批数字混在一起就不再可比——所以必须挑一个，然后一直用它。")
    print()
    return lib, mine, ratio


SONGS = [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚")]


def nb_rms_vs_ae():
    """整首 30 秒：均方根和振幅包络放在一起，看哪条更经得起一个孤立尖峰。

    第 07 课只从公式上说「RMS 比 AE 更不怕离群值」。这里在三段真实音乐上
    量两件事：正常起伏时两条曲线各抖多少；人为塞进一个样本的爆音时，
    那一帧的读数各被抬高多少倍。
    """
    print("[正文] 第 3 步 · 均方根和振幅包络放在一起：谁更怕一个孤立的尖峰")
    print(f"  整首 30 秒，帧长 {FRAME_LENGTH}、帧移 {HOP_LENGTH}，不做归一化")
    print(f"  {'':6}{'AE÷RMS':>9}{'AE 起伏':>9}{'RMS 起伏':>10}"
          f"{'爆音后 AE':>11}{'爆音后 RMS':>12}")
    out = {}
    for nm, zh in SONGS:
        y, sr = io.load(nm)
        f = frame(y, FRAME_LENGTH, HOP_LENGTH)
        ae, r = amplitude_envelope(f), rms(f)
        cv_ae, cv_rms = float(np.std(ae) / np.mean(ae)), float(np.std(r) / np.mean(r))
        # 第 10 秒处的一个样本换成 ±0.9，模拟一声「咔」
        y2 = y.copy()
        i = int(10 * sr)
        y2[i] = 0.9 if y2[i] >= 0 else -0.9
        f2 = frame(y2, FRAME_LENGTH, HOP_LENGTH)
        ae2, r2 = amplitude_envelope(f2), rms(f2)
        k = int(np.argmax(np.abs(ae2 - ae)))
        out[nm] = {"zh": zh, "ae": thin(ae, 320), "rms": thin(r, 320),
                   "level_ratio": float(np.median(ae / r)),
                   "cv_ae": cv_ae, "cv_rms": cv_rms,
                   "click_ae": float(ae2[k] / ae[k]),
                   "click_rms": float(r2[k] / r[k])}
        o = out[nm]
        print(f"  {zh:6}{o['level_ratio']:9.2f}{cv_ae:9.3f}{cv_rms:10.3f}"
              f"{o['click_ae']:10.2f}倍{o['click_rms']:11.3f}倍")
    print("  AE÷RMS：同一帧里 AE 大约是 RMS 的 3 倍，两条曲线不在同一个高度。")
    print("  起伏（标准差÷平均值）：正常音乐里两条曲线抖得差不多。")
    print("  一个样本的爆音：AE 被抬高 4.6—6.0 倍，RMS 只多 9%—13%。")
    print("  所以 RMS「更稳」稳在不怕孤立尖峰，不是整条曲线更平。")
    print()
    return out


def nb_zcr_rate_and_count():
    """库返回的是「比例」，乘上帧长才是这一帧真正穿过中线的次数。"""
    print("[正文] 第 4 步补充 · 过零率是比例，乘帧长才是次数")
    import librosa
    alt = np.tile([1.0, -1.0], FRAME_LENGTH)
    top = librosa.feature.zero_crossing_rate(
        alt, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, center=False)[0][0]
    print(f"  每个样本都换号的极端信号：librosa 给 {top:.6f}"
          f" = {FRAME_LENGTH - 1}/{FRAME_LENGTH}，到不了 1")
    print(f"  整首 30 秒，帧长 {FRAME_LENGTH}（{FRAME_LENGTH / 22050 * 1000:.1f} 毫秒）")
    print(f"  {'':6}{'平均比例':>10}{'每帧平均次数':>12}{'最多的一帧':>10}")
    out = {}
    for nm, zh in SONGS:
        y, sr = io.load(nm)
        z = librosa.feature.zero_crossing_rate(
            y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, center=False)[0]
        out[nm] = {"zh": zh, "mean": float(z.mean()),
                   "count": float(z.mean() * FRAME_LENGTH),
                   "max_count": int(round(z.max() * FRAME_LENGTH))}
        print(f"  {zh:6}{z.mean():10.4f}{z.mean() * FRAME_LENGTH:12.1f}"
              f"{out[nm]['max_count']:10d}")
    print("  摇滚每帧平均穿过中线约 127 次，是古典（73）和爵士（64）的近两倍。")
    print("  爵士不在中间，反而最低。")
    print()
    return {"top": float(top), "songs": out}


def nb_voice_by_frame():
    """语音逐帧看过零率：整段平均会把几帧嘶嘶声抹平。"""
    print("[正文] 第 5 步补充 · 语音逐帧看：有声音的帧里，过零率差了十倍")
    y, sr = io.load("voice")
    f = frame(y, FRAME_LENGTH, HOP_LENGTH)
    r, z = rms(f), zero_crossing_rate(f)
    sounding = r > np.percentile(r, 30)          # 去掉最安静的三成，只看有声音的帧
    med = float(np.median(z[sounding]))
    top = np.sort(z[sounding])[-5:]
    times = sorted(round(float(i) * HOP_LENGTH / sr, 1)
                   for i in np.argsort(np.where(sounding, z, 0))[-5:])
    print(f"  整首 30 秒，帧长 {FRAME_LENGTH}，只看最响的七成帧（{int(sounding.sum())} 帧）")
    print(f"  过零率中位数 {med:.3f}，最高的 5 帧 {[round(float(v), 3) for v in top]}")
    print(f"  最高的几帧出现在第 {times} 秒，是中位数的 {top.min() / med:.0f} 倍以上")
    print("  元音一类的浊音过零少，嘶嘶声一类的清音过零多；整段平均把这几帧抹平了。")
    print()
    return {"median": med, "top": [float(v) for v in top], "times": times}


def dump_figures(clips, mine_rms, lib_zcr, mine_zcr, ratio, ae_rms, zcr_count):
    """这一课要上图的数：对齐结果、五段素材、直流偏置。"""
    y, sr = io.load("debussy", seconds=3)
    n = min(len(lib_zcr), len(mine_zcr))
    path = dump(9, {
        "frame_length": FRAME_LENGTH, "hop_length": HOP_LENGTH,
        "speech_frame": SPEECH_FRAME_LENGTH, "speech_hop": SPEECH_HOP_LENGTH,
        "wave": thin(y, 700),
        "rms": mine_rms,
        "zcr_lib": lib_zcr[:n],
        "zcr_mine": mine_zcr[:n],
        "zcr_ratio": ratio,
        "zcr_ratio_theory": FRAME_LENGTH / (FRAME_LENGTH - 1),
        "clips": {k: {"zh": v["zh"],
                      "rms_mean": float(np.mean(v["rms"])),
                      "zcr_mean": float(np.mean(v["zcr"])),
                      "rms": thin(v["rms"], 320),
                      "zcr": thin(v["zcr"], 320)}
                  for k, v in clips.items()},
        "ae_vs_rms": ae_rms,
        "zcr_count": zcr_count,
    })
    print(f"[配图数据] 写好了 {path}")


def step1_four_numbers():
    print("[正文] 第 1 步 · 四个数，直接平均等于 0，均方根不等于 0")
    q = np.array([1.0, -1.0, 0.5, -0.5])
    sq = q ** 2
    print(f"  原始四个数   {q.tolist()}   直接求平均 = {q.mean():.1f}")
    print(f"  每个数平方   {sq.tolist()}   负号没有了")
    print(f"  求平均       {sq.mean():.4f}   这一步叫「均方」")
    print(f"  再开平方     {np.sqrt(sq.mean()):.4f}   量级回到和原数一样")
    print("  名字就是倒着念这三步：根 · 均 · 方。")
    print()


def step2_outlier():
    print("[正文] 第 2 步 · 100 个数里只有一个 1.0，两个特征说法完全不同")
    one = np.zeros(100)
    one[50] = 1.0
    print(f"  振幅包络 AE  {np.abs(one).max():.2f}   ← 满格")
    print(f"  均方根 RMS   {np.sqrt(np.mean(one ** 2)):.2f}   ← 十分之一")
    print(f"  两者相差 {np.abs(one).max() / np.sqrt(np.mean(one ** 2)):.0f} 倍。"
          "AE 只看那一个数，RMS 把 100 个数一起算。")
    print("  一帧里有 K 个数、只有一个是 A 时，RMS 恰好是 A / sqrt(K)：")
    for k in (4, 100, 1024):
        v = np.zeros(k)
        v[0] = 1.0
        print(f"    K = {k:5d}  RMS = {np.sqrt(np.mean(v ** 2)):.4f}"
              f"   1/sqrt(K) = {1 / np.sqrt(k):.4f}")
    print()


def load_clips():
    """五段素材，各取 3 秒并按自身峰值归一化。

    先归一化，是为了让下面的比较不掺进「谁录得响」。第 07 课量过：
    不做这一步，RMS 比的是录音电平，不是声音本身。
    """
    out = {}
    for nm, zh in CLIPS:
        y, _ = io.load(nm, seconds=3)
        y = io.peak_normalize(y)
        f = frame(y, N, H)
        out[nm] = {"zh": zh, "y": y, "rms": rms(f), "zcr": zero_crossing_rate(f)}
    return out


def step3_real(clips):
    print(f"[正文] 第 3 步 · 五段素材，帧长 {N}（{N / SR * 1000:.1f} 毫秒）、"
          f"帧移 {H}（{H / SR * 1000:.1f} 毫秒）")
    print(f"  {'':8}{'RMS 平均':>11}{'ZCR 平均':>11}{'帧数':>7}")
    for nm, zh in CLIPS:
        c = clips[nm]
        print(f"  {zh:8}{c['rms'].mean():11.4f}{c['zcr'].mean():11.4f}"
              f"{len(c['rms']):7d}")
    print("  语音 0.0922 和噪声 0.1141 挨得太近，靠过零率分不开这一对。")
    print("  古典 0.0655 和摇滚 0.1260 差了近一倍，这一对才分得开。")
    print()


def level_dc_offset(clips):
    print("[正文] 加一层 · 波形整条抬离中线，过零率就凭空掉下去")
    y = clips["voice"]["y"]
    for d in (0.0, 0.02, 0.05):
        z = zero_crossing_rate(frame(y + d, N, H)).mean()
        print(f"  整条抬高 {d:.2f}：过零率 {z:.4f}"
              + ("" if d == 0 else
                 f"   比原来低 {(1 - z / zero_crossing_rate(frame(y, N, H)).mean()):.0%}"))
    print("  声音一点没变，只是整条曲线离开了中线，低处的摆动够不着零线了。")
    print("  真实录音里这种偏移来自设备直流偏置，肉眼在波形图上几乎看不出来。")
    print("  对策：算过零率之前先减去整段的平均值。")
    z0 = zero_crossing_rate(frame(y, N, H)).mean()
    zc = zero_crossing_rate(frame(y - y.mean(), N, H)).mean()
    print(f"  [正文] 这段人声自己就带偏置：平均值 {y.mean():.4f}（峰值的 {y.mean():.1%}）")
    print(f"  减去平均值后过零率 {z0:.4f} → {zc:.4f}，是原来的 {zc / z0:.3f} 倍")
    print()


def level_threshold(clips):
    print("[正文] 加一层 · 零线阈值：把靠近零的小数当成零")
    y = clips["voice"]["y"]
    f = frame(y, N, H)
    for t in (0.0, 1e-4, 1e-2):
        print(f"  阈值 {t:<8g} 过零率 {zero_crossing_rate(f, t).mean():.4f}")
    print("  0.0001 几乎没有影响，0.01 把读数压低了 15%。")
    print("  阈值该设多大取决于录音底噪，但整个数据集必须用同一个值。")
    print()


def best_1d(a, b):
    """在一条轴上试遍所有阈值，返回能达到的最高正确率（%）。"""
    vals = sorted(set(list(a) + list(b)))
    best = 0.0
    for i in range(len(vals) - 1):
        cut = (vals[i] + vals[i + 1]) / 2
        acc = (sum(1 for v in a if v < cut) + sum(1 for v in b if v >= cut)) / (len(a) + len(b))
        best = max(best, acc, 1 - acc)
    return round(best * 100, 1)


def best_2d(ax, ay, bx, by):
    """两轴各自标准化后，按到两类中心的距离归类，返回正确率（%）。"""
    X = np.array([list(ax) + list(bx), list(ay) + list(by)], dtype=float).T
    lab = np.array([0] * len(ax) + [1] * len(bx))
    X = (X - X.mean(0)) / (X.std(0) + 1e-12)
    c0, c1 = X[lab == 0].mean(0), X[lab == 1].mean(0)
    pred = (np.linalg.norm(X - c1, axis=1) < np.linalg.norm(X - c0, axis=1)).astype(int)
    return round(float((pred == lab).mean()) * 100, 1)


def level_joint(clips):
    print("[正文] 加一层 · 「两个数一起看更好」到底好多少")
    d, r = clips["debussy"], clips["redhot"]
    only_rms = best_1d(d["rms"], r["rms"])
    only_zcr = best_1d(d["zcr"], r["zcr"])
    both = best_2d(d["rms"], d["zcr"], r["rms"], r["zcr"])
    n = len(d["rms"]) + len(r["rms"])
    print(f"  古典 {len(d['rms'])} 帧 + 摇滚 {len(r['rms'])} 帧 = {n} 帧，"
          "逐帧判断它属于哪一类")
    print(f"  只看 RMS，挑最好的一条分界线   {only_rms}%")
    print(f"  只看 ZCR，挑最好的一条分界线   {only_zcr}%")
    print(f"  两个一起看                     {both}%")
    print(f"  两个一起只比单看 RMS 多 {both - only_rms:.1f} 个百分点。")
    print("  「两个特征一起看更好」是对的，但强多少值得自己量一次再说。")
    print()


def write_features(clips, path="features.csv"):
    print("[脚本额外] 写出第一版 features.csv")
    rows = []
    for nm, zh in CLIPS:
        c = clips[nm]
        f = frame(c["y"], N, H)
        row = {"file": nm, "style": zh, "n_frames": len(c["rms"])}
        for key, curve in [("ae", amplitude_envelope(f)),
                           ("rms", c["rms"]), ("zcr", c["zcr"])]:
            for k, v in summarize(curve).items():
                row[f"{key}_{k}"] = round(v, 6)
        rows.append(row)
    with open(path, "w", newline="", encoding="utf-8") as fp:
        w = csv.DictWriter(fp, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"  写好了：{os.path.abspath(path)}")
    print(f"  {len(rows)} 行 × {len(rows[0])} 列。参数：sr={SR} "
          f"frame={N} hop={H} 归一化=峰值")
    print("  这四个参数必须和表存在一起。少了它们，这张表下次就复现不出来。")
    print()


if __name__ == "__main__":
    # 先按 notebook 的顺序：库函数 → 手写 → 对齐。对齐是这一课的核心，
    # 数值对不上就说明两边对「一帧是哪些样本」的理解不一样。
    y0, sr0, lib_rms = nb1_rms_librosa()
    mine_rms = nb2_rms_from_scratch(y0, sr0, lib_rms)
    ae_rms = nb_rms_vs_ae()
    lib_zcr, mine_zcr, ratio = nb3_zcr_librosa_vs_mine()
    zcr_count = nb_zcr_rate_and_count()

    # 公式本身的两个小例子
    step1_four_numbers()
    step2_outlier()

    clips = load_clips()
    step3_real(clips)
    nb_voice_by_frame()
    level_dc_offset(clips)
    level_threshold(clips)
    level_joint(clips)
    write_features(clips)

    if "--dump" in sys.argv:
        dump_figures(clips, mine_rms, lib_zcr, mine_zcr, ratio, ae_rms, zcr_count)

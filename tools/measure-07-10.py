# -*- coding: utf-8 -*-
"""第 07-10 课的全部数字和配图数据，都从这里跑出来。

正文里写的每一个数，必须能在这个脚本的输出里找到同一个数。第 01 课那次
教训还在：手写分帧和 librosa 的分帧差半个窗，同一份数据能算出 3.5 倍
而不是 11.4 倍。所以这里的分帧只有一个实现，正文照抄它。

用法：python tools/measure-07-10.py
产出：tools/data/07-time-features.json … 10-probe.json
"""
import sys
import json
import os

sys.stdout.reconfigure(encoding="utf-8")  # Windows 默认 cp932，中文会崩

import numpy as np
import librosa

AUD = "source_course/audio_resources"
OUT = "tools/data"
os.makedirs(OUT, exist_ok=True)
SR = 22050


def dump(name, obj):
    with open(f"{OUT}/{name}.json", "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print(f"  -> {OUT}/{name}.json")


def frame(y, n=1024, hop=512):
    m = 1 + (len(y) - n) // hop
    idx = np.arange(n)[None, :] + hop * np.arange(m)[:, None]
    return y[idx]


def ae(f):
    return np.max(np.abs(f), axis=1)


def rms(f):
    return np.sqrt(np.mean(f ** 2, axis=1))


def zcr(f, thr=0.0):
    s = np.zeros_like(f, dtype=int)
    s[f > thr] = 1
    s[f < -thr] = -1
    out = []
    for row in s:
        nz = row[row != 0]
        out.append(0.0 if len(nz) < 2 else np.count_nonzero(nz[1:] != nz[:-1]) / (f.shape[1] - 1))
    return np.array(out)


# ---------------------------------------------------------------- 07
print("== 07 三种时域证据 ==")
N = 1024
spike = np.zeros(N)
spike[N // 2] = 1.0
t = np.arange(N) / SR
hum = 0.2 * np.sin(2 * np.pi * 220 * t)

rows = []
for nm, f in [("一下尖峰", spike), ("持续振动", hum)]:
    a = float(np.max(np.abs(f)))
    r = float(np.sqrt(np.mean(f ** 2)))
    z = float(zcr(f[None, :])[0])
    rows.append({"name": nm, "ae": round(a, 4), "rms": round(r, 4), "zcr": round(z, 4)})
    print(f"  {nm}: AE={a:.4f} RMS={r:.4f} ZCR={z:.4f}")
print(f"  AE 之比 尖峰/振动 = {rows[0]['ae'] / rows[1]['ae']:.1f}")
print(f"  RMS 之比 振动/尖峰 = {rows[1]['rms'] / rows[0]['rms']:.1f}")

# 两套都要：原样读进来的，和按第 03 课统一过电平的。
# 只给原样那一套，会把「录得响」当成「风格不同」——这一课整篇就是在防这个。
def norm_rms(y, target_dbfs=-20.0):
    r = np.sqrt(np.mean(y ** 2))
    return y * (10 ** (target_dbfs / 20) / max(r, 1e-12))


music = {}
music_norm = {}
for nm in ["debussy", "duke", "redhot"]:
    y, _ = librosa.load(f"{AUD}/{nm}.wav", sr=SR, mono=True)
    y = y[:10 * SR]
    for tag, yy in [("raw", y), ("norm", norm_rms(y))]:
        fr = frame(yy)
        rec = {
            "ae_mean": round(float(ae(fr).mean()), 4),
            "rms_mean": round(float(rms(fr).mean()), 4),
            "zcr_mean": round(float(zcr(fr).mean()), 4),
            "n_frames": int(fr.shape[0]),
        }
        (music if tag == "raw" else music_norm)[nm] = rec
    print(f"  {nm} 原样  : {music[nm]}")
    print(f"  {nm} 统一后: {music_norm[nm]}")

for tag, tbl in [("原样", music), ("统一电平后", music_norm)]:
    sp = {k: round(tbl["redhot"][k] / tbl["debussy"][k], 2)
          for k in ("ae_mean", "rms_mean", "zcr_mean")}
    print(f"  摇滚 / 古典 倍数（{tag}）: AE {sp['ae_mean']}× RMS {sp['rms_mean']}× ZCR {sp['zcr_mean']}×")

y_d, _ = librosa.load(f"{AUD}/debussy.wav", sr=SR, mono=True)
seg = y_d[:3 * SR]
fr = frame(seg)
dump("07-time-features", {
    "sr": SR, "frame": N, "hop": 512,
    "toy": rows,
    "toy_wave": {
        "spike": [round(float(v), 5) for v in spike[::4]],
        "hum": [round(float(v), 5) for v in hum[::4]],
    },
    "music": music,
    "music_norm": music_norm,
    "curves": {
        "ae": [round(float(v), 5) for v in ae(fr)],
        "rms": [round(float(v), 5) for v in rms(fr)],
        "zcr": [round(float(v), 5) for v in zcr(fr)],
        "wave": [round(float(v), 5) for v in seg[::16]],
    },
})

# ---------------------------------------------------------------- 08
print("== 08 振幅包络 ==")
four = np.array([-0.2, 0.7, -0.9, 0.4])
print(f"  max={four.max():.1f}  max|.|={np.abs(four).max():.1f}  差 {np.abs(four).max() - four.max():.1f}")

L = len(seg)
n, hop = 1024, 512
m = 1 + (L - n) // hop
used = (m - 1) * hop + n
tail = {"L": int(L), "n": n, "hop": hop, "frames": int(m),
        "used": int(used), "left": int(L - used),
        "left_ms": round((L - used) / SR * 1000, 2)}
print(f"  {tail}")

# 帧长的代价，用一段能验证的素材来量：两下敲击间隔 30 毫秒。
# 直接拿音乐去比帧长，三条包络的峰值和标准差几乎一样，什么也证明不了；
# 造两个已知间隔的脉冲，才能量出「多长的帧会把两下并成一下」。
gap_ms = 30
two = np.zeros(SR // 2)
hit_at = [SR // 8, SR // 8 + int(SR * gap_ms / 1000)]
for h in hit_at:
    dec = np.exp(-np.arange(600) / 120.0)
    two[h:h + 600] += dec * np.sin(2 * np.pi * 900 * np.arange(600) / SR)


def peaks(v, rel=0.25):
    """数出比左右邻居都高、且高过全曲峰值 rel 倍的点。"""
    thr = v.max() * rel
    return int(sum(1 for i in range(1, len(v) - 1)
                   if v[i] > thr and v[i] >= v[i - 1] and v[i] > v[i + 1]))


sizes = {}
for nn in (256, 1024, 4096):
    e = ae(frame(two, nn, nn // 2))
    sizes[str(nn)] = {"frames": int(len(e)), "ms": round(nn / SR * 1000, 1),
                      "peaks": peaks(e),
                      "max": round(float(e.max()), 4),
                      "curve": [round(float(v), 5) for v in e]}
    print(f"  帧长 {nn} ({sizes[str(nn)]['ms']} ms): {len(e)} 帧, 数出 {peaks(e)} 个峰")
print(f"  两下敲击真实间隔 {gap_ms} ms")

# 08-envelope-steps 那张图要的数据：一小段真实波形、它被切成的帧、每帧的
# 最大绝对值。图上要把「切段 → 每段取一个数 → 连成曲线」三步画在同一条
# 时间轴上，所以三样必须来自同一次分帧，不能在 Node 里再切一遍。
# 素材用 duke 的第 3.489 秒那一小段，不用 debussy：钢琴曲在 100 毫秒的尺度上
# 太平了，八帧的包络从 0.18 到 0.21，画出来是一条直线，看不出「包络贴着外沿走」。
# 这一段里有一次明显的起音，八帧的包络从 0.034 涨到 0.395，差 11.5 倍。
STEP_N, STEP_HOP = 512, 256
_dk, _ = librosa.load(f"{AUD}/duke.wav", sr=SR, mono=True)
step_seg = _dk[76928:76928 + 8 * STEP_HOP + (STEP_N - STEP_HOP)]
step_fr = frame(step_seg, STEP_N, STEP_HOP)
envsteps = {
    "src": "duke.wav @ 3.489s", "n": STEP_N, "hop": STEP_HOP,
    "wave": [round(float(v), 5) for v in step_seg],
    "frames": int(step_fr.shape[0]),
    "ae": [round(float(v), 5) for v in ae(step_fr)],
    "argmax": [int(i) for i in np.argmax(np.abs(step_fr), axis=1)],
}
print(f"  包络三步图：{len(step_seg)} 个样本切成 {envsteps['frames']} 帧，"
      f"每帧取一个最大绝对值")

c_true = librosa.util.frame(np.pad(seg, 512, mode="constant"),
                            frame_length=1024, hop_length=512).shape[1]
c_false = librosa.util.frame(seg, frame_length=1024, hop_length=512).shape[1]
print(f"  center=True {c_true} 帧 / center=False {c_false} 帧，差 {c_true - c_false}")
shift_ms = round(1024 / 2 / SR * 1000, 2)
print(f"  帧中心比帧起点晚 {shift_ms} ms")
dump("08-envelope", {"sr": SR, "four": four.tolist(), "tail": tail, "sizes": sizes,
                     "envsteps": envsteps,
                     "gap_ms": gap_ms,
                     "two_wave": [round(float(v), 5) for v in two[:SR // 4:4]],
                     "center": {"true": int(c_true), "false": int(c_false)},
                     "shift_ms": shift_ms,
                     "wave": [round(float(v), 5) for v in seg[::16]]})

# ---------------------------------------------------------------- 09
print("== 09 RMS 与过零率 ==")
q = np.array([1.0, -1.0, 0.5, -0.5])
print(f"  {q.tolist()}  直接平均={q.mean():.1f}  RMS={np.sqrt(np.mean(q ** 2)):.4f}")

one = np.zeros(100)
one[50] = 1.0
print(f"  100 个数里一个 1.0：AE={np.abs(one).max():.1f} RMS={np.sqrt(np.mean(one ** 2)):.2f}")

y_v, _ = librosa.load(f"{AUD}/voice.wav", sr=SR, mono=True)
y_n, _ = librosa.load(f"{AUD}/noise.wav", sr=SR, mono=True)
y_r, _ = librosa.load(f"{AUD}/redhot.wav", sr=SR, mono=True)
y_b, _ = librosa.load(f"{AUD}/debussy.wav", sr=SR, mono=True)
pair = {}
for nm, yy in [("voice", y_v), ("noise", y_n), ("redhot", y_r), ("debussy", y_b)]:
    yy = yy[:3 * SR] / max(np.abs(yy[:3 * SR]).max(), 1e-9)
    fr2 = frame(yy, 400, 160)
    pair[nm] = {"rms_mean": round(float(rms(fr2).mean()), 4),
                "zcr_mean": round(float(zcr(fr2).mean()), 4),
                "rms": [round(float(v), 5) for v in rms(fr2)],
                "zcr": [round(float(v), 5) for v in zcr(fr2)]}
    print(f"  {nm}: RMS={pair[nm]['rms_mean']}  ZCR={pair[nm]['zcr_mean']}")

yv = y_v[:3 * SR] / max(np.abs(y_v[:3 * SR]).max(), 1e-9)
off = {}
for d in (0.0, 0.02, 0.05):
    off[str(d)] = round(float(zcr(frame(yv + d, 400, 160)).mean()), 4)
print(f"  加直流偏置后的平均过零率: {off}")

thr = {}
for tv in (0.0, 1e-4, 1e-2):
    thr[str(tv)] = round(float(zcr(frame(yv, 400, 160), tv).mean()), 4)
print(f"  零线阈值的影响: {thr}")

# 配图不能画凭空编的波形：取一小段真实语音存进 JSON，三张小图画的是同一段，
# 只是纵向平移，读者才验证得了「声音没变，只是位置变了」。
clip = yv[int(0.9 * SR):int(0.9 * SR) + 900]
# 07-zcr-definition 那张图要在真实波形上标出每一个过零点。交叉点的位置
# 也在这里算好存进 JSON——Node 那边只负责画，不重新判断哪里算穿过。
clip_thin = clip[::5]
sgn = np.sign(clip_thin)
cross = [int(i) for i in range(len(clip_thin) - 1)
         if sgn[i] != 0 and sgn[i + 1] != 0 and sgn[i] != sgn[i + 1]]
print(f"  配图这一小段抽稀到 {len(clip_thin)} 个点，其中 {len(cross)} 处穿过中线")

clip_zcr = {str(d): round(float(zcr((clip + d)[None, :])[0]), 4) for d in (0.0, 0.02, 0.05)}
print(f"  配图这一小段自己的过零率: {clip_zcr}")

# 「两个数一起看比单看一个强」不能靠眼睛断言，要给出可复算的数字：
# 每一轴各找出分得最准的那条阈值线，再看两轴一起用能到多少。
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
    """把两轴各自标准化后，按到两类中心的距离归类，返回正确率（%）。"""
    X = np.array([ax + bx, ay + by], dtype=float).T
    lab = np.array([0] * len(ax) + [1] * len(bx))
    X = (X - X.mean(0)) / (X.std(0) + 1e-12)
    c0, c1 = X[lab == 0].mean(0), X[lab == 1].mean(0)
    pred = (np.linalg.norm(X - c1, axis=1) < np.linalg.norm(X - c0, axis=1)).astype(int)
    return round(float((pred == lab).mean()) * 100, 1)


sep = {
    "rms": best_1d(pair["debussy"]["rms"], pair["redhot"]["rms"]),
    "zcr": best_1d(pair["debussy"]["zcr"], pair["redhot"]["zcr"]),
}
sep["both"] = best_2d(pair["debussy"]["rms"], pair["debussy"]["zcr"],
                      pair["redhot"]["rms"], pair["redhot"]["zcr"])
print(f"  古典 vs 摇滚，逐帧分对的比例：只看 RMS {sep['rms']}% / 只看 ZCR {sep['zcr']}% / 两个一起 {sep['both']}%")

dump("09-rms-zcr", {"sr": SR, "quad": q.tolist(),
                    "quad_rms": round(float(np.sqrt(np.mean(q ** 2))), 4),
                    "pair": pair, "offset": off, "threshold": thr,
                    "clip": [round(float(v), 5) for v in clip[::5]],
                    "clip_zcr": clip_zcr, "sep": sep,
                    "clip_cross": cross})

# ---------------------------------------------------------------- 10
print("== 10 频率试探 ==")
sr10 = 4000
t10 = np.arange(sr10) / sr10
sig = np.sin(2 * np.pi * 440 * t10) + 0.5 * np.sin(2 * np.pi * 880 * t10)


def probe_sin(x, f):
    return float(2 * np.mean(x * np.sin(2 * np.pi * f * t10)))


def probe_cos(x, f):
    return float(2 * np.mean(x * np.cos(2 * np.pi * f * t10)))


def mag(x, f):
    return float(np.hypot(probe_sin(x, f), probe_cos(x, f)))


for f in (440, 500, 880):
    print(f"  用 {f} Hz 试探：相乘求平均再乘 2 = {probe_sin(sig, f):+.4f}")

sig_c = np.cos(2 * np.pi * 440 * t10) + 0.5 * np.cos(2 * np.pi * 880 * t10)
print(f"  把起点挪四分之一圈后，同一支试探波在 440 Hz 上得到 {probe_sin(sig_c, 440):+.4f}")
print(f"  改用两支试探波合起来：原信号 {mag(sig, 440):.4f} / 挪过起点的 {mag(sig_c, 440):.4f}")

fs = np.arange(100, 2001, 2.0)
sweep_sin = [round(probe_sin(sig, f), 5) for f in fs]
sweep_mag = [round(mag(sig, f), 5) for f in fs]
sweep_csin = [round(probe_sin(sig_c, f), 5) for f in fs]
sweep_cmag = [round(mag(sig_c, f), 5) for f in fs]
print(f"  扫频最高点：{fs[int(np.argmax(sweep_mag))]:.0f} Hz")
dump("10-probe", {"sr": sr10, "freqs": [float(f) for f in fs],
                  "sweep_sin": sweep_sin, "sweep_mag": sweep_mag,
                  "sweep_csin": sweep_csin, "sweep_cmag": sweep_cmag,
                  "at": {"440": round(probe_sin(sig, 440), 4),
                         "500": round(probe_sin(sig, 500), 4),
                         "880": round(probe_sin(sig, 880), 4),
                         "shift440_sin": round(probe_sin(sig_c, 440), 4),
                         "mag440": round(mag(sig, 440), 4),
                         "shift_mag440": round(mag(sig_c, 440), 4)},
                  "wave": [round(float(v), 5) for v in sig[:200]],
                  "parts": {"440": [round(float(v), 5) for v in np.sin(2 * np.pi * 440 * t10)[:200]],
                            "880": [round(float(v), 5) for v in (0.5 * np.sin(2 * np.pi * 880 * t10))[:200]]}})
print("done")

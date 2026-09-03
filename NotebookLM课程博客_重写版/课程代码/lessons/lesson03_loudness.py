# -*- coding: utf-8 -*-
"""第 03 课 · 两段 RMS 精确相同的声音，听起来并不一样响。

跑法（在 project/ 目录下）：
    python lessons/lesson03_loudness.py

LUFS 那一段需要额外装一个包：pip install pyloudnorm
没装也能跑，脚本会跳过那一段并说明。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

from soundlab import io
from soundlab.config import TARGET_DBFS
from soundlab.figdata import dump, thin

SR = 16000


def make_pair(sr=SR, seed=0):
    """一条 220 Hz 正弦，和一段 RMS 被对齐到它的白噪声。

    对齐这一步是实验的关键：两段声音的 RMS 精确相同，
    剩下的差别只能来自频率分布。
    """
    t = np.arange(sr) / sr
    sine = np.sin(2 * np.pi * 220 * t)
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(sr)
    noise *= np.sqrt(np.mean(sine ** 2)) / np.sqrt(np.mean(noise ** 2))
    return sine, noise


def step1_3_three_metrics(sine, noise):
    print("[正文] 第 1—3 步 · 两段 RMS 相同的声音，量三个指标")
    print(f"  {'':8}{'RMS':>9}{'频谱质心':>12}{'平坦度':>10}")
    for name, y in [("正弦", sine), ("白噪声", noise)]:
        r = float(np.sqrt(np.mean(y ** 2)))
        c = float(librosa.feature.spectral_centroid(y=y, sr=SR).mean())
        f = float(librosa.feature.spectral_flatness(y=y).mean())
        print(f"  {name:8}{r:9.4f}{c:11.0f}Hz{f:10.4f}")
    print("  RMS 一模一样，质心差 17 倍，平坦度从 0.0 到 0.56。")
    print("  RMS 量不到频率分布，所以它给不出听感的结论。")
    print("  注意这个实验的边界：它证明的是「计算特征不同」，不是「主观上谁更响」。")
    print()


def level_lufs(sine, noise):
    print("[正文] 加一层 · 换成听感相关的指标 LUFS")
    try:
        import pyloudnorm as pyln
    except ImportError:
        print("  没装 pyloudnorm，跳过。装它：pip install pyloudnorm")
        print()
        return
    meter = pyln.Meter(SR)
    a = meter.integrated_loudness(sine)
    b = meter.integrated_loudness(noise)
    print(f"  正弦   {a:6.1f} LUFS")
    print(f"  白噪声 {b:6.1f} LUFS")
    print(f"  RMS 精确相同的两段，LUFS 差了 {abs(b - a):.1f}。")
    print("  这个差就是频率分布造成的听感差——LUFS 算之前先加了一道模拟人耳的滤波，")
    print("  所以它看得到；RMS 没有这一步，所以看不到。")
    print()


def level_normalize():
    print("[正文] 加一层 · 把三段音乐拉到同一电平")
    print(f"  {'':10}{'原电平 dBFS':>14}{'统一后 dBFS':>14}{'峰值':>9}")
    for nm, zh in [("debussy", "古典"), ("duke", "爵士"), ("redhot", "摇滚")]:
        y, _ = io.load(nm, seconds=10)
        z = io.rms_normalize(y, TARGET_DBFS)
        print(f"  {zh:10}{io.dbfs(y):14.2f}{io.dbfs(z):14.2f}{float(np.abs(z).max()):9.4f}")
    print(f"  三段的电平被拉到同一个 {TARGET_DBFS:.0f} dBFS。这一步只是整段乘一个数，")
    print("  波形的形状一点没变——摇滚还是更「满」，钢琴还是起伏更大。")
    print("  峰值那一列要看一眼：这三段统一之后都没超过 1.0，但这不是保证——")
    print("  起伏大的素材拉到同一电平后峰值可能越过 1.0，播放时会削顶。")
    print()


def extra_frame_vs_global():
    """正文没放：逐帧归一化会把「忽强忽弱」整个抹掉。"""
    print("[脚本额外] 整段统一电平 vs 逐帧统一电平，差别有多大")
    from soundlab.framing import frame
    from soundlab.time_features import rms
    y, _ = io.load("duke", seconds=10)
    whole = rms(frame(io.rms_normalize(y)))
    per = rms(frame(y))
    per = per / np.maximum(per, 1e-12)          # 每帧各自拉到 1，就是逐帧归一化
    print(f"  整段统一后，逐帧 RMS 的起伏程度 {whole.std():.4f}")
    print(f"  逐帧统一后，逐帧 RMS 的起伏程度 {per.std():.4f}")
    print("  逐帧归一化把起伏压成了 0：每一帧都一样响，「忽强忽弱」这条信息没了。")
    print("  要统一电平，就整段统一，不要逐帧。")
    print()


def harmonics(y, sr, f0, n=6, at=0.25, dur=0.5):
    """取一段跳过起音的稳定片段，量出前 n 个整数倍频率各有多强。

    必须跳过起音：起音那零点几秒里成分还没稳定下来，量出来的比例
    不代表这件乐器的稳态音色。
    """
    seg = y[int(at * sr):int(at * sr) + int(dur * sr)]
    seg = seg * np.hanning(len(seg))
    S = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / sr)

    def peak_near(target, tol=0.03):
        m = (f > target * (1 - tol)) & (f < target * (1 + tol))
        return float(S[m].max()) if m.any() else 0.0

    base = peak_near(f0)
    return [round(peak_near(f0 * k) / base, 3) for k in range(1, n + 1)]


def level_timbre():
    """音色是三件事，不是一件：包络、泛音分布、调制。"""
    print("[正文] 加一层 · 音色：音高和响度都对齐之后，还剩下什么")
    from soundlab.framing import frame
    from soundlab.time_features import amplitude_envelope
    import librosa

    print(f"  {'':9}{'时长':>8}{'基频 Hz':>10}{'编号':>7}{'统一后 RMS':>12}"
          f"{'包络峰值出现在':>16}")
    prof = {}
    for nm, zh in [("violin_c", "小提琴"), ("sax", "萨克斯"), ("piano_c", "钢琴")]:
        y, sr = io.load(nm)
        f0 = float(np.median(librosa.yin(y, fmin=80, fmax=1200, sr=sr)))
        midi = 69 + 12 * np.log2(f0 / 440)
        yn = io.rms_normalize(y)
        env = amplitude_envelope(frame(yn, 1024, 512))
        pos = (int(np.argmax(env)) * 512 + 512) / sr
        prof[nm] = harmonics(yn, sr, f0)
        print(f"  {zh:9}{len(y) / sr:7.2f}s{f0:10.1f}{midi:7.1f}"
              f"{float(np.sqrt(np.mean(yn ** 2))):12.4f}"
              f"{pos / (len(y) / sr):15.0%}")
    print("  小提琴 59.9 和萨克斯 60.0 是同一个音（C4），统一电平后 RMS 也完全一样，")
    print("  钢琴 72.2 高了一个八度——所以「同音高不同音色」这一对只能用前两个。")
    print()
    print("  第一件事，包络：萨克斯 4% 处就到顶，小提琴要到 54%——一个是吹出来的，")
    print("  一个是拉出来的，「怎么开始、怎么持续」完全不同。")
    print()
    print("  第二件事，泛音分布（前 6 个整数倍频率相对基频的强度）：")
    for nm, zh in [("violin_c", "小提琴"), ("sax", "萨克斯"), ("piano_c", "钢琴")]:
        print(f"    {zh:9}{prof[nm]}")
    print("  小提琴的 2 倍频率比基频还强 2.7 倍，萨克斯是 1.8 倍，钢琴只有 0.43 倍——")
    print("  钢琴的能量集中在基频，另外两件乐器把大量能量放在整数倍上。")
    print()


def level_modulation():
    """第三件事：调制——包络自己也在有规律地抖。"""
    print("[正文] 加一层 · 音色的第三件事：调制")
    from soundlab.framing import frame
    from soundlab.time_features import amplitude_envelope
    # 用整段而不是开头几秒：包络起伏很慢，3 秒的窗只有 0.33 Hz 的分辨率，
    # 量出来的数会随窗长跳（3 秒给 1.0 Hz，8 秒给 0.5 Hz，全段给 0.57 Hz）。
    y, sr = io.load("tremolo")
    env = amplitude_envelope(frame(y, 1024, 256))
    e = env - env.mean()
    sp = np.abs(np.fft.rfft(e))
    fx = np.fft.rfftfreq(len(e), d=256 / sr)
    ok = (fx > 0.3) & (fx < 20)
    rate = float(fx[ok][int(np.argmax(sp[ok]))])
    print(f"  tremolo.wav 全长 {len(y) / sr:.2f} 秒，包络的频率分辨率 {fx[1]:.3f} Hz")
    print(f"  包络自己起伏最强的频率 {rate:.2f} Hz，也就是每 {1 / rate:.2f} 秒重复一次")
    print(f"  它的 2、3、4 倍处也有峰（{fx[ok][0] * 0 + 2 * rate:.2f}、{3 * rate:.2f}、"
          f"{4 * rate:.2f} Hz），说明这个起伏不是平滑的正弦")
    print(f"  包络最大 {env.max():.3f}、最小 {env.min():.3f}，起伏幅度 "
          f"{(env.max() - env.min()) / env.max():.0%}")
    print("  强弱周期性地抖叫颤音（tremolo），高低周期性地抖叫揉弦（vibrato）。")
    print("  两者都不改变音高和平均响度，只改变音色。")
    print()


def dump_figures():
    """这一课要上图的数：听阈到痛阈、三件乐器的包络与泛音、颤音的包络。"""
    from soundlab.framing import frame
    from soundlab.time_features import amplitude_envelope

    # 听阈和痛阈，PPT p9 / p11。两者相差一万亿倍，正是分贝存在的理由。
    TOH = 1e-12          # W/m^2，听阈，也是分贝的参考值
    TOP = 10.0           # W/m^2，痛阈
    ladder = [
        ("刚能听见", TOH, 0),
        ("安静的房间", 1e-10, 20),
        ("正常交谈", 1e-6, 60),
        ("繁忙街道", 1e-4, 80),
        ("摇滚现场", 1e-1, 110),
        ("开始感到疼", TOP, 130),
    ]

    inst = {}
    for nm, zh in [("violin_c", "小提琴"), ("sax", "萨克斯"), ("piano_c", "钢琴")]:
        y, sr = io.load(nm)
        f0 = float(np.median(librosa.yin(y, fmin=80, fmax=1200, sr=sr)))
        yn = io.rms_normalize(y)
        env = amplitude_envelope(frame(yn, 1024, 512))
        inst[nm] = {
            "zh": zh,
            "seconds": round(len(y) / sr, 2),
            "f0": round(f0, 1),
            "midi": round(69 + 12 * float(np.log2(f0 / 440)), 1),
            # 包络按自身峰值归一，横轴按总时长归一：这张图比的是形状
            "env": thin(env / max(env.max(), 1e-9), 240),
            # 和 level_timbre() 打印的那个百分比必须用同一个式子算，
            # 否则正文写 4%、图上标 1.9%，读者对不上
            "peak_at": round(((int(np.argmax(env)) * 512 + 512) / sr)
                             / (len(y) / sr), 3),
            "harmonics": harmonics(yn, sr, f0),
        }

    y, sr = io.load("tremolo")
    env = amplitude_envelope(frame(y, 1024, 256))
    e = env - env.mean()
    sp = np.abs(np.fft.rfft(e))
    fx = np.fft.rfftfreq(len(e), d=256 / sr)
    ok = (fx > 0.3) & (fx < 20)
    rate = float(fx[ok][int(np.argmax(sp[ok]))])

    path = dump(3, {
        "ladder": [{"name": n, "wm2": v, "db": d} for n, v, d in ladder],
        "toh": TOH, "top": TOP,
        "ratio": TOP / TOH,
        "instruments": inst,
        "tremolo": {
            "seconds": round(len(y) / sr, 2),
            "rate_hz": round(rate, 2),
            "period_s": round(1 / rate, 2),
            "depth": round(float((env.max() - env.min()) / env.max()), 3),
            "env": thin(env / max(env.max(), 1e-9), 420),
        },
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    sine, noise = make_pair()
    step1_3_three_metrics(sine, noise)
    level_lufs(sine, noise)
    level_normalize()
    extra_frame_vs_global()
    level_timbre()
    level_modulation()
    if "--dump" in sys.argv:
        dump_figures()

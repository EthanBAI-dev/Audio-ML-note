# -*- coding: utf-8 -*-
"""第 03 课「音色是三件事」那一节要用的每一个数，都从这里跑出来。

用法：python tools/measure-03-timbre.py
产出：tools/data/03-timbre.json

为什么单开一个脚本：旧的 03-timbre.svg 画的是钢琴对小提琴，图注写着
「两者音高完全相同」——实测钢琴是 MIDI 72.2（C5）、小提琴 59.9（C4），
差整整一个八度，那句话是错的。这里换成 violin_c 对 sax（都是 C4），
把「同音高、同响度、不同音色」这件事真正做成一次受控对比。
"""
import sys
import os
import json

sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, "source_course", "audio_resources")
OUT = os.path.join(ROOT, "tools", "data")
SR = 22050
N, H = 1024, 512


def frame(y, n=N, hop=H):
    m = 1 + (len(y) - n) // hop
    idx = np.arange(n)[None, :] + hop * np.arange(m)[:, None]
    return y[idx]


def ae(f):
    return np.max(np.abs(f), axis=1)


def rms_normalize(y, target_dbfs=-20.0):
    r = float(np.sqrt(np.mean(y.astype(np.float64) ** 2)))
    return y * (10 ** (target_dbfs / 20) / max(r, 1e-12))


def harmonics(y, sr, f0, n=6, at=0.25, dur=0.5):
    """跳过起音，取一段稳定的，量前 n 个整数倍频率相对基频的强度。

    必须跳过起音：起音那零点几秒成分还没稳，量出来的比例不代表稳态音色。
    """
    seg = y[int(at * sr):int(at * sr) + int(dur * sr)]
    seg = seg * np.hanning(len(seg))
    S = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / sr)

    def peak_near(t, tol=0.03):
        m = (f > t * (1 - tol)) & (f < t * (1 + tol))
        return float(S[m].max()) if m.any() else 0.0

    base = peak_near(f0)
    return [round(peak_near(f0 * k) / base, 3) for k in range(1, n + 1)]


def thin(v, k):
    """把一条曲线抽稀到大约 k 个点，图上画不了几百个点。"""
    v = np.asarray(v, dtype=float)
    step = max(1, len(v) // k)
    return [round(float(x), 5) for x in v[::step]]


print("== 三件乐器：音高、电平、包络、泛音 ==")
inst = {}
for nm, zh in [("violin_c", "小提琴"), ("sax", "萨克斯"), ("piano_c", "钢琴")]:
    y, sr = librosa.load(os.path.join(AUD, nm + ".wav"), sr=SR, mono=True)
    f0 = float(np.median(librosa.yin(y, fmin=80, fmax=1200, sr=sr)))
    midi = 69 + 12 * np.log2(f0 / 440)
    yn = rms_normalize(y)
    env = ae(frame(yn))
    # 和 lessons/lesson03_loudness.py 用同一套换算：帧中心的时刻占全长的比例
    peak_at = ((int(np.argmax(env)) * H + H) / sr) / (len(y) / sr)
    inst[nm] = {
        "zh": zh,
        "dur": round(len(y) / sr, 2),
        "f0": round(f0, 1),
        "midi": round(float(midi), 1),
        "rms": round(float(np.sqrt(np.mean(yn ** 2))), 4),
        "peak_at": round(peak_at, 3),
        "env": thin(env / env.max(), 160),
        "harm": harmonics(yn, sr, f0),
    }
    print(f"  {zh}: 基频 {inst[nm]['f0']} Hz  编号 {inst[nm]['midi']}  "
          f"RMS {inst[nm]['rms']}  包络峰值在 {peak_at:.0%}  泛音 {inst[nm]['harm']}")

print("== 调制：tremolo.wav ==")
y, sr = librosa.load(os.path.join(AUD, "tremolo.wav"), sr=SR, mono=True)
env = ae(frame(y, N, 256))
e = env - env.mean()
sp = np.abs(np.fft.rfft(e))
fx = np.fft.rfftfreq(len(e), d=256 / sr)
ok = (fx > 0.3) & (fx < 20)
rate = float(fx[ok][int(np.argmax(sp[ok]))])
trem = {
    "dur": round(len(y) / sr, 2),
    "rate": round(rate, 2),
    "period": round(1 / rate, 2),
    "depth": round(float((env.max() - env.min()) / env.max()), 3),
    "env": thin(env / env.max(), 240),
    "res": round(float(fx[1]), 3),
}
print(f"  全长 {trem['dur']} 秒，包络起伏 {trem['rate']} Hz（每 {trem['period']} 秒一次），"
      f"幅度 {trem['depth']:.0%}，频率分辨率 {trem['res']} Hz")

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "03-timbre.json"), "w", encoding="utf-8") as f:
    json.dump({"sr": SR, "frame": N, "hop": H, "inst": inst, "tremolo": trem},
              f, ensure_ascii=False, indent=1)
print(f"  -> {os.path.join(OUT, '03-timbre.json')}")

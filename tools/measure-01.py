#!/usr/bin/env python
"""算出第 01 课配图要用的数据，存成 JSON。

    python tools/measure-01.py

图和正文必须报同一个数字。正文里的代码是 Python 写的（用 numpy 的随机数），
Node 那边复现不出同一串随机数，所以数据在这里算，图那边只负责画。
"""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")   # Windows 默认 cp932，中文会炸

import librosa
import numpy as np

OUT = pathlib.Path(__file__).resolve().parent / "data"
OUT.mkdir(exist_ok=True)

SR = 22050

# —— 和正文 Hello World 完全相同的那段信号 ——
rng = np.random.default_rng(0)
t = np.arange(3 * SR) / SR
hum = 0.3 * np.sin(2 * np.pi * 220 * t) + 0.15 * np.sin(2 * np.pi * 440 * t)

knock = np.zeros_like(hum)
k0, n = int(1.5 * SR), int(0.03 * SR)
knock[k0:k0 + n] = rng.standard_normal(n) * 0.9 * np.exp(-np.arange(n) / 120)
mix = hum + knock

# —— 左图：整段频谱，有敲击 vs 没敲击 ——
Smix = np.abs(np.fft.rfft(mix))
Shum = np.abs(np.fft.rfft(hum))
diff_pct = float(np.max(np.abs(Smix - Shum)) / Smix.max() * 100)

FMAX = 900                              # 两个成分在 220 和 440，看到 900 就够
freqs = np.fft.rfftfreq(len(mix), 1 / SR)
keep = freqs <= FMAX
peak = float(Smix.max())

# 抽稀到 360 点，SVG 画不动两千多个点。
# 必须**取每一段的最大值**，不能等距取点：220 Hz 那根峰只有一两个频率格宽，
# 等距抽样会整个跳过它，画出来是一条平线。
def pool(arr, n=360):
    a = arr[keep] / peak
    edges = np.linspace(0, len(a), n + 1).astype(int)
    return [round(float(a[i:max(j, i + 1)].max()), 5) for i, j in zip(edges[:-1], edges[1:])]

spectrum = {
    "fmax": FMAX,
    "mix": pool(Smix),
    "hum": pool(Shum),
    "diff_pct": round(diff_pct, 2),
}

# —— 右图：声谱图每一列的总能量随时间变化 ——
# 必须用 librosa.stft，和正文那段代码一模一样。它默认 center=True，
# 会在开头补半个窗，帧号和「手动 i*hop 分帧」差半个窗——用错了列号，
# 同一份数据能算出 3.5 倍而不是 11.4 倍。
NFFT, HOP = 1024, 256
Sg = np.abs(librosa.stft(mix, n_fft=NFFT, hop_length=HOP))
col_energy = Sg.sum(axis=0)

col_knock = int(1.5 * SR / HOP)
col_ref = col_knock - 8
ratio = float(col_energy[col_knock] / col_energy[col_ref])

hi = float(col_energy.max())
columns = {
    "values": [round(float(v / hi), 5) for v in col_energy],
    "knock_col": col_knock,
    "ref_col": col_ref,
    "ratio": round(ratio, 1),
    "seconds": round(len(mix) / SR, 2),
}

(OUT / "01-knock.json").write_text(
    json.dumps({"spectrum": spectrum, "columns": columns}, ensure_ascii=False, indent=1),
    encoding="utf-8")

print(f"整段频谱最大差异 {diff_pct:.2f} %")
print(f"敲击那一列 / 8 列之前 = {ratio:.1f} 倍")
print(f"频谱 {len(spectrum['mix'])} 点，声谱图 {len(columns['values'])} 列 → {OUT / '01-knock.json'}")

"""对照原型：同一段信号，用 librosa + matplotlib 渲染。

    python tools/proto_matplotlib.py

输出 tmp/proto/E-matplotlib-*.png，与 Node 版 SVG 做对比。
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import librosa
import librosa.display

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp" / "proto"
OUT.mkdir(parents=True, exist_ok=True)

# 中文字体显式绑定，避免缺字方块
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei"]
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["figure.facecolor"] = "white"
plt.rcParams["savefig.facecolor"] = "white"

SR = 16000
BLUE = "#2a78d6"
INK = "#0b0b0b"
MUTED = "#6f7b89"


def synth_hum_knock(sr=SR, dur=2.0, knock_at=1.25):
    """与 Node 版 dsp.mjs 的 synthHumAndKnock 对应：持续嗡嗡声 + 一次敲击。"""
    t = np.arange(int(sr * dur)) / sr
    rng = np.random.default_rng(7)
    swell = 0.86 + 0.14 * np.sin(2 * np.pi * 0.7 * t)
    y = swell * (
        0.30 * np.sin(2 * np.pi * 180 * t)
        + 0.16 * np.sin(2 * np.pi * 360 * t + 0.7)
        + 0.08 * np.sin(2 * np.pi * 540 * t + 1.9)
    )
    y += 0.004 * rng.uniform(-1, 1, len(t))
    k0 = int(knock_at * sr)
    n = int(sr * 0.18)
    env = np.exp(-np.arange(n) / (sr * 0.02))
    y[k0:k0 + n] += 0.9 * env * rng.uniform(-1, 1, n)
    return y


def three_views(y, sr, name, cmap="magma", fmax=2000, title=""):
    fig, ax = plt.subplots(1, 3, figsize=(11.0, 2.9), dpi=150)

    ax[0].plot(np.arange(len(y)) / sr, y, color=BLUE, lw=0.5)
    ax[0].set_title("波形　什么时候在抖", loc="left", fontsize=11, color=INK)
    ax[0].set_xlabel("时间 (秒)", fontsize=9, color=MUTED)

    mid = int(len(y) * 0.35)
    mag = np.abs(np.fft.rfft(y[mid:mid + 2048] * np.hanning(2048)))
    freq = np.fft.rfftfreq(2048, 1 / sr)
    keep = freq <= fmax
    ax[1].plot(freq[keep], mag[keep] / mag[keep].max(), color=BLUE, lw=1.2)
    ax[1].set_title("频谱　有哪些高低成分", loc="left", fontsize=11, color=INK)
    ax[1].set_xlabel("频率 (Hz)", fontsize=9, color=MUTED)

    S = librosa.amplitude_to_db(
        np.abs(librosa.stft(y, n_fft=1024, hop_length=128)), ref=np.max
    )
    img = librosa.display.specshow(
        S, sr=sr, hop_length=128, x_axis="time", y_axis="hz",
        cmap=cmap, vmin=-55, vmax=0, ax=ax[2],
    )
    ax[2].set_ylim(0, fmax)
    ax[2].set_title("声谱图　哪些成分在什么时候出现", loc="left", fontsize=11, color=INK)
    ax[2].set_xlabel("时间 (秒)", fontsize=9, color=MUTED)
    ax[2].set_ylabel("频率 (Hz)", fontsize=9, color=MUTED)
    fig.colorbar(img, ax=ax[2], format="%+2.0f dB", pad=0.02)

    for a in ax:
        a.tick_params(labelsize=8, colors=MUTED)
        for side in ("top", "right"):
            a.spines[side].set_visible(False)

    if title:
        fig.suptitle(title, fontsize=13, x=0.008, ha="left", y=0.99, color=INK)
    fig.tight_layout(rect=(0, 0, 1, 0.94 if title else 1))
    path = OUT / name
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


made = []
made.append(three_views(synth_hum_knock(), SR, "E-matplotlib-magma.png",
                        cmap="magma", title="matplotlib + librosa · magma"))
made.append(three_views(synth_hum_knock(), SR, "E-matplotlib-viridis.png",
                        cmap="viridis", title="matplotlib + librosa · viridis"))

piano, sr_p = librosa.load(str(ROOT / "source_course" / "audio_resources" / "piano_c.wav"), sr=SR, mono=True)
made.append(three_views(piano, SR, "E-matplotlib-piano-magma.png",
                        cmap="magma", title="matplotlib + librosa · piano_c.wav"))

for p in made:
    print(p.relative_to(ROOT), f"{p.stat().st_size / 1024:.0f} KB")

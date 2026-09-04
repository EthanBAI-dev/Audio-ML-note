# -*- coding: utf-8 -*-
"""第 19 课 · 倒谱：把「谁在发声」和「发的什么音」分开。

跑法（在 project/ 目录下）：
    python lessons/lesson19_cepstrum.py
    python lessons/lesson19_cepstrum.py --dump

对应 source_course/19 - MFCCs Explained Easily/
Mel-Frequency Cepstral Coefficients Explained Easily.pdf。

这一课只有 PDF，而 PDF 里最要紧的两页（p53、p54「把两部分分开」）**只有示意图，
一个数都没有**。所以这个脚本的任务是把那两张图变成能核对的数：

  1. 取对数真的把乘法变成了加法吗？        —— 量残差
  2. 两部分真的落在倒频率轴的两端吗？      —— 量能量占比
  3. 提升真的能取回包络吗？                —— 和「不提升」比
  4. DCT 真的去掉了梅尔带之间的相关吗？    —— 量 DCT 前后的相关系数

第 4 条是 p68 一句话带过的，也是这一课最值钱的一条。

**本课不调 librosa.feature.mfcc。** 那是第 20 课的正题（调库并对齐），
和第 17→18 是同一种结构；提前调掉，下一课就没得写了。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np
import librosa
from scipy.fftpack import dct, idct

from soundlab import io
from soundlab.config import SR
from soundlab.figdata import dump

N_FFT = 2048
HOP = 512
N_MELS = 40
F0_SYNTH = 100.0          # 合成激励的基频
CUT = 30                  # 提升的分界格；下面会扫一遍说明它不是随便定的
CEP_SHOW = 400            # 倒谱图只画前 400 格（18.1 ms），再往后是空的


# ---------------------------------------------------------------- 合成素材
def make_parts():
    """造一个「快变的激励 × 慢变的包络」谱。

    为什么要合成而不是直接用真实录音：真实录音里没有「标准答案」——你不知道
    真正的包络长什么样，也就没法量「提升取回来的对不对」。这里两部分是自己
    放进去的，每一步都能和原件比。真实语音留到第 3 步。
    """
    f = np.fft.rfftfreq(N_FFT, 1.0 / SR)

    def formant(fc, bw, a):
        """一个共振峰：嘴巴摆成某个形状时，对数谱上鼓起来的那个包。"""
        return a / (1.0 + ((f - fc) / (bw / 2.0)) ** 2)

    # 包络 H：三个共振峰。它对应「嘴摆成什么形状」，也就是发的什么音。
    H = 0.05 + formant(700, 260, 1.0) + formant(1220, 300, 0.55) \
        + formant(2600, 500, 0.28)

    # 激励 E：基频 100 Hz 的一串谐波。它对应「声带振多快」，也就是音高。
    E = np.full_like(f, 0.02)
    for k in range(1, int(SR / 2 / F0_SYNTH) + 1):
        E += np.exp(-0.5 * ((f - k * F0_SYNTH) / (F0_SYNTH * 0.18)) ** 2)

    return f, E, H


def step1_log_turns_product_into_sum(E, H):
    print("[正文] 第 1 步 · 取对数，把乘法变成加法")
    X = E * H
    lx, le, lh = np.log(X), np.log(E), np.log(H)
    resid = float(np.max(np.abs(lx - (le + lh))))
    print(f"  频谱上两部分是相乘的：X = E · H")
    print(f"  取对数之后 max|log X − (log E + log H)| = {resid:.3e}")
    print("  这个数是浮点运算的残渣，等于严格相等。整条倒谱的路子就建在这一步上：")
    print("  相乘的两样东西分不开，相加的两样东西才有可能分开。")
    print()
    return lx, le, lh, resid


# ---------------------------------------------------------------- 倒谱
def cepstrum(log_spec):
    """对数谱再做一次逆傅里叶变换，就是倒谱。

    横轴不再是频率而是「倒频率」，单位是秒：第 n 个点对应 n / 采样率 秒。
    所以倒谱上第 n 个峰，指的是「对数谱每隔 采样率/n 赫兹重复一次」。
    """
    return np.fft.irfft(log_spec)


def structure_energy_split(c, cut):
    """倒谱前半段里，分界线两侧各占多少能量。

    第 0 个点是整条对数谱的平均值——它只说明这段声音整体多响，不携带结构，
    所以分母里要把它去掉，否则两边加起来永远不到 100%。
    """
    half = len(c) // 2
    e = c[1:half] ** 2
    lo = float(e[:cut - 1].sum() / e.sum())
    return lo, 1.0 - lo


def step2_two_ends(lx, le, lh):
    print("[正文] 第 2 步 · 两部分落在倒频率轴的两端")
    c, ce, ch = cepstrum(lx), cepstrum(le), cepstrum(lh)
    q_ms = 1000.0 / SR
    print(f"  倒谱长度 {len(c)}，一格 = {q_ms:.4f} 毫秒")
    print(f"  分界线放在第 {CUT} 格，也就是 {CUT * q_ms:.2f} 毫秒")
    print(f"  {'':12}{'低倒频率':>10}{'高倒频率':>10}")
    rows = {}
    for name, key, v in [("包络（发什么音）", "H", ch),
                         ("激励（谁在发声）", "E", ce),
                         ("两者相乘", "X", c)]:
        lo, hi = structure_energy_split(v, CUT)
        rows[key] = {"lo": lo, "hi": hi}
        print(f"  {name:12}{lo:9.1%}{hi:10.1%}")
    print("  包络几乎全在左边，激励几乎全在右边——它们本来就是「慢变」和「快变」，")
    print("  倒谱做的事就是按变化快慢把一条曲线拆成两堆。")

    half = len(c) // 2
    peak = CUT + int(np.argmax(np.abs(c[CUT:half])))
    print(f"  合成谱倒谱在分界线右边的最高峰：第 {peak} 格 = {peak * q_ms:.2f} 毫秒")
    print(f"  倒过来 1 / {peak * q_ms / 1000:.5f} 秒 = {SR / peak:.1f} Hz，"
          f"放进去的基频是 {F0_SYNTH:.0f} Hz")
    print("  这个峰有个名字叫「第一个倒谐波」。它就是激励的周期本身。")
    print()
    return c, ce, ch, rows, peak


# ---------------------------------------------------------------- 提升
def lifter(c, cut):
    """只留低倒频率那一段，再变回频率轴上，得到平滑的包络。

    倒谱是实偶对称的，所以两头都要留：留 [0, cut) 就必须同时留 (-cut, 0)，
    也就是尾部那 cut-1 个点。只留前一半的话变回去会得到复数。
    """
    keep = np.zeros_like(c)
    keep[:cut] = c[:cut]
    keep[-(cut - 1):] = c[-(cut - 1):]
    return np.fft.rfft(keep).real


def step3_liftering(lx, lh, c, E_ref):
    print("[正文] 第 3 步 · 提升：只留低倒频率，把包络取回来")
    rec = lifter(c, CUT)
    span = float(lh.max() - lh.min())
    offset = float(rec.mean() - lh.mean())

    # 提升取回的是包络的「形状」，整体高度会差一个常数——正是激励对数谱的平均值。
    rec_a = rec - offset
    raw_a = lx - lx.mean() + lh.mean()
    e_lift = float(np.sqrt(np.mean((rec_a - lh) ** 2)))
    e_raw = float(np.sqrt(np.mean((raw_a - lh) ** 2)))

    print(f"  真包络 log H 自己的跨度是 {span:.3f}")
    print(f"  提升取回来的那条，整体比 log H 高出 {offset:+.4f}，"
          f"而 log E 的平均值正好是 {float(np.mean(np.log(E_ref))):+.4f}")
    print("  这个常数不是误差：低倒频率那一段里也含着激励的平均电平，")
    print("  所以取回的是包络的**形状**，整体高度要另外定。对齐平均值之后再比：")
    print(f"  {'':22}{'均方根差':>10}{'占跨度':>9}")
    print(f"  {'提升之后':22}{e_lift:10.4f}{e_lift / span:9.1%}")
    print(f"  {'不提升，直接拿对数谱当包络':22}{e_raw:10.4f}{e_raw / span:9.1%}")
    print(f"  提升把误差压到原来的 1/{e_raw / e_lift:.1f}。")

    sweep = []
    for cut in (10, 20, 30, 40, 60, 100):
        r = lifter(c, cut)
        r = r - r.mean() + lh.mean()
        rmse = float(np.sqrt(np.mean((r - lh) ** 2)))
        sweep.append({"cut": cut, "ms": cut * 1000.0 / SR, "rmse": rmse})
    print("  分界线放在哪并不敏感——扫一遍看：")
    for s in sweep:
        print(f"    第 {s['cut']:3d} 格（{s['ms']:5.2f} ms）均方根差 {s['rmse']:.4f}")
    print("  太小会把包络自己的细节也切掉，太大会把激励放进来；中间一大段都差不多。")
    print()
    return rec, offset, e_lift, e_raw, span, sweep


# ---------------------------------------------------------------- 真实语音
def step4_real_voice():
    print("[正文] 第 4 步 · 换成真实语音：倒谱的第一个峰就是基频")
    y, sr = io.load("voice")
    print(f"  voice.wav {len(y)} 个样本，{len(y) / sr:.2f} 秒")

    S = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP))
    energy = S.sum(axis=0)
    f0_yin = librosa.yin(y, fmin=60, fmax=400, sr=sr,
                         frame_length=N_FFT, hop_length=HOP)
    lo, hi = int(sr / 400), int(sr / 60)      # 只在 60—400 Hz 对应的区间里找峰

    rows = []
    for k in range(min(len(f0_yin), S.shape[1])):
        start = k * HOP
        if start + N_FFT > len(y):
            break
        if energy[k] < np.percentile(energy, 80):
            continue
        seg = y[start:start + N_FFT] * np.hanning(N_FFT)
        c = cepstrum(np.log(np.abs(np.fft.rfft(seg)) + 1e-12))
        p = lo + int(np.argmax(c[lo:hi]))
        rows.append((k, sr / p, float(f0_yin[k]), float(c[p]), p))

    arr = np.array([(r[1], r[2], r[3]) for r in rows])
    rel = np.abs(arr[:, 0] - arr[:, 1]) / arr[:, 1]
    strong = arr[:, 2] > np.percentile(arr[:, 2], 60)
    rel_s = np.abs(arr[strong, 0] - arr[strong, 1]) / arr[strong, 1]

    best = int(np.argmax(arr[:, 2]))
    bk, bq, byin, _, bp = rows[best]
    print(f"  取能量最高的那 20% 帧，一共 {len(rows)} 帧")
    print(f"  倒谱峰最突出的一帧（第 {bk} 帧，{bk * HOP / sr:.3f} 秒）：")
    print(f"    倒谱第 {bp} 格 = {bp * 1000 / sr:.2f} 毫秒 → {bq:.1f} Hz")
    print(f"    librosa.yin 在同一帧上给出 {byin:.1f} Hz，差 {abs(bq - byin) / byin:.1%}")
    print(f"  全部 {len(rows)} 帧一起看：中位相对差 {np.median(rel):.1%}，"
          f"差在 5% 以内的占 {(rel < 0.05).mean():.0%}")
    print(f"  只看倒谱峰明显的那 40% 帧：中位相对差 {np.median(rel_s):.1%}，"
          f"差在 5% 以内的占 {(rel_s < 0.05).mean():.0%}")
    print("  峰不明显的帧多半是清音（气流噪声，声带没振），本来就没有基频可找。")
    print("  **注意这条结论的方向**：倒谱里明明白白装着音高。所以「MFCC 和音高无关」")
    print("  这句话只对**低阶系数**近似成立，不能当成倒谱本身的性质。")

    stats = {
        "frames": len(rows),
        "best_frame": bk, "best_time": bk * HOP / sr,
        "best_bin": bp, "best_ms": bp * 1000 / sr,
        "best_cep_hz": bq, "best_yin_hz": byin,
        "median_rel": float(np.median(rel)),
        "within5": float((rel < 0.05).mean()),
        "median_rel_strong": float(np.median(rel_s)),
        "within5_strong": float((rel_s < 0.05).mean()),
    }
    print()
    return y, sr, stats, rows[best]


# ---------------------------------------------------------------- DCT
def step5_dct_decorrelate(y, sr):
    print("[正文] 第 5 步 · DCT 为什么值得再做一次：去相关")
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=N_FFT,
                                         hop_length=HOP, n_mels=N_MELS)
    L = librosa.power_to_db(mel)
    print(f"  对数梅尔谱 {L.shape}：{N_MELS} 个梅尔带 × {L.shape[1]} 帧")

    def corr_stats(M):
        C = np.corrcoef(M)
        n = C.shape[0]
        off = C[~np.eye(n, dtype=bool)]
        return float(np.abs(off).mean()), float(np.abs(np.diag(C, 1)).mean()), C

    a_mel, n_mel, C_mel = corr_stats(L)
    D = dct(L, axis=0, type=2, norm="ortho")
    a_dct, n_dct, C_dct = corr_stats(D)

    print(f"  {'':16}{'任意两条的平均|相关|':>22}{'相邻两条':>12}")
    print(f"  {'梅尔带之间':16}{a_mel:20.4f}{n_mel:12.4f}")
    print(f"  {'DCT 系数之间':16}{a_dct:20.4f}{n_dct:12.4f}")
    print(f"  平均相关性掉了 {1 - a_dct / a_mel:.0%}，相邻的从 {n_mel:.2f} 掉到 {n_dct:.2f}。")
    print("  相邻梅尔带 0.95 的相关不是巧合：三角形本来就互相重叠，一个音响起来")
    print("  它的泛音会同时点亮好几条带。四十个数里真正互不重复的远不到四十个。")
    print()

    print("[正文] 第 5 步续 · 那么取几个系数够用")
    recon = []
    for K in (5, 13, 20, 40):
        Dk = D.copy()
        Dk[K:] = 0
        R = idct(Dk, axis=0, type=2, norm="ortho")
        rmse = float(np.sqrt(np.mean((R - L) ** 2)))
        var = float(1 - np.var(R - L) / np.var(L))
        recon.append({"k": K, "rmse": rmse, "var": var, "ratio": K / N_MELS})
        print(f"  前 {K:2d} 个系数重建：均方根差 {rmse:6.3f} dB，"
              f"解释掉原谱 {var:.1%} 的变化，只用了 {K / N_MELS:.0%} 的数")
    en = (D ** 2).sum(axis=1)
    en = en / en.sum()
    print(f"  前 13 个系数占总能量 {en[:13].sum():.1%}")
    print("  传统上取 12—13 个，就是在这条曲线上挑的：再往后加，换来的越来越少。")
    print()
    return L, D, C_mel, C_dct, {
        "shape": list(L.shape),
        "corr_mel": a_mel, "corr_mel_adj": n_mel,
        "corr_dct": a_dct, "corr_dct_adj": n_dct,
        "drop": 1 - a_dct / a_mel,
        "recon": recon,
        "energy13": float(en[:13].sum()),
    }


def extra_why_not_idft(L):
    """正文放不下：同样是「再变换一次」，DCT 比逆傅里叶变换好在哪。

    第一版这里用一条随机游走当素材，结果 DFT 的第 0 项反而占得更多，
    和「DCT 能量更集中」的说法正好相反。原因是那条假数据的均值本身就很大，
    比的其实是均值。改成拿真实的对数梅尔谱、并且**去掉均值项**再比。
    """
    print("[脚本额外] 同样再变换一次，为什么用 DCT 不用逆傅里叶变换")
    D = dct(L, axis=0, type=2, norm="ortho")
    F = np.fft.rfft(L, axis=0)
    print(f"  一条 {N_MELS} 个数的对数谱：")
    print(f"    DCT 给出 {D.shape[0]} 个**实数**")
    print(f"    逆傅里叶变换给出 {F.shape[0]} 个**复数**，"
          f"也就是 {F.shape[0] * 2} 个实数——数反而变多了")
    ed = (D[1:] ** 2).sum(axis=1)
    ef = (np.abs(F[1:]) ** 2).sum(axis=1)
    ed, ef = ed / ed.sum(), ef / ef.sum()
    print("  去掉均值项之后，前 K 项累计占多少能量：")
    print(f"    {'K':>3}{'DCT':>9}{'DFT':>9}")
    for K in (1, 2, 3, 5, 8, 12):
        print(f"    {K:>3}{ed[:K].sum():9.1%}{ef[:K].sum():9.1%}")
    print("  第一项就差得很明显：78.7% 对 47.1%。DCT 假定曲线在两端是对称延拓的，")
    print("  傅里叶变换假定它是首尾相接周期延拓的——后者在接缝处凭空造出一个跳变，")
    print("  那个跳变要靠很多高阶项去描述，能量就散开了。")
    print()


# ---------------------------------------------------------------- 配图数据
def thin_curve(v, n=420):
    v = np.asarray(v, dtype=float)
    if len(v) <= n:
        return [round(float(x), 5) for x in v]
    step = np.linspace(0, len(v), n + 1).astype(int)
    return [round(float(v[i:max(j, i + 1)][np.argmax(np.abs(v[i:max(j, i + 1)]))]), 5)
            for i, j in zip(step[:-1], step[1:])]


def dump_figures(f, E, H, lx, le, lh, resid, c, ce, ch, split, peak,
                 rec, offset, e_lift, e_raw, span, sweep,
                 voice_stats, best_row, C_mel, C_dct, dct_stats, y, sr):
    half = len(c) // 2
    q_ms = 1000.0 / SR
    # 只画到 4000 Hz：三个共振峰都在这以下，再往上是空的
    keep = int(4000 / (SR / N_FFT))

    bk, bq, byin, _, bp = best_row
    seg = y[bk * HOP: bk * HOP + N_FFT] * np.hanning(N_FFT)
    vlog = np.log(np.abs(np.fft.rfft(seg)) + 1e-12)
    vcep = cepstrum(vlog)

    payload = {
        "sr": SR, "n_fft": N_FFT, "hop": HOP, "n_mels": N_MELS,
        "f0_synth": F0_SYNTH, "cut": CUT, "cut_ms": CUT * q_ms,
        "q_ms": q_ms,
        "spec": {
            "fmax": 4000.0,
            "E": thin_curve(E[:keep]), "H": thin_curve(H[:keep]),
            "X": thin_curve((E * H)[:keep]),
            "logE": thin_curve(le[:keep]), "logH": thin_curve(lh[:keep]),
            "logX": thin_curve(lx[:keep]),
            "resid": resid,
        },
        # 倒谱只画前 CEP_SHOW 格。全部 1024 格画出来，1.36 ms 的分界线和
        # 9.98 ms 的那个峰会挤在最左边一小撮里，什么都看不清。
        # 这一段不抽稀，下标就是格号，画图那边不用再换算。
        "cep": {
            "nmax": CEP_SHOW,
            "qmax_ms": CEP_SHOW * q_ms,
            "H": [round(float(v), 5) for v in ch[:CEP_SHOW]],
            "E": [round(float(v), 5) for v in ce[:CEP_SHOW]],
            "X": [round(float(v), 5) for v in c[:CEP_SHOW]],
            "split": split,
            "peak_bin": peak, "peak_ms": peak * q_ms, "peak_hz": SR / peak,
        },
        "lift": {
            "logH": thin_curve(lh[:keep]),
            "rec": thin_curve((rec - offset)[:keep]),
            "raw": thin_curve((lx - lx.mean() + lh.mean())[:keep]),
            "offset": offset, "span": span,
            "rmse_lift": e_lift, "rmse_raw": e_raw,
            "gain": e_raw / e_lift,
            "sweep": sweep,
        },
        "voice": dict(voice_stats, **{
            "logspec": thin_curve(vlog[:keep]),
            "cep": [round(float(v), 5) for v in vcep[:CEP_SHOW]],
            "cep_nmax": CEP_SHOW,
        }),
        "dct": dict(dct_stats, **{
            "corr_mel": [[round(float(v), 3) for v in row] for row in C_mel],
            "corr_dct": [[round(float(v), 3) for v in row] for row in C_dct],
            "corr_mel_avg": dct_stats["corr_mel"],
            "corr_dct_avg": dct_stats["corr_dct"],
        }),
    }
    print(f"[配图数据] 写好了 {dump(19, payload)}")


if __name__ == "__main__":
    print(f"采样率 {SR}，帧长 {N_FFT}，帧移 {HOP}，梅尔带 {N_MELS}\n")
    f, E, H = make_parts()
    lx, le, lh, resid = step1_log_turns_product_into_sum(E, H)
    c, ce, ch, split, peak = step2_two_ends(lx, le, lh)
    rec, offset, e_lift, e_raw, span, sweep = step3_liftering(lx, lh, c, E)
    y, sr, voice_stats, best_row = step4_real_voice()
    L, D, C_mel, C_dct, dct_stats = step5_dct_decorrelate(y, sr)
    extra_why_not_idft(L)
    if "--dump" in sys.argv:
        dump_figures(f, E, H, lx, le, lh, resid, c, ce, ch, split, peak,
                     rec, offset, e_lift, e_raw, span, sweep,
                     voice_stats, best_row, C_mel, C_dct, dct_stats, y, sr)

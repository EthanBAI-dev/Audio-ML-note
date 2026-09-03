# -*- coding: utf-8 -*-
"""第 07 课 · 三个时域特征的定义与公式。

跑法（在 project/ 目录下）：
    python lessons/lesson07_three_time_features.py

对应 source_course/07 - Time-domain audio features/Time-domain audio features.pdf。
PPT 的顺序是：三个特征总览 → AE（定义、公式逐项拆、优缺点、应用）
→ RMS（同上）→ ZCR（定义、符号函数、公式、应用）。本脚本按同一顺序走。

这是一节**定义课**：只用一个可以拿笔算的小帧把三个公式各验证一遍，
再用一小段真实声音说明三者回答的问题不同。三段音乐的完整可视化和
逐帧实现留给第 08、09 课，这里不做。

正文里的每一个数都在带 [正文] 标记的输出里。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.config import SR, FRAME_LENGTH, HOP_LENGTH
from soundlab.framing import frame
from soundlab.time_features import (
    amplitude_envelope, rms, zero_crossing_rate, all_three)

# 一个能拿笔算完的小帧。八个数，正负都有，够把三个公式各走一遍。
TOY = np.array([0.3, 0.7, -0.2, -0.9, 0.4, 0.1, -0.5, 0.6])


def step1_amplitude_envelope():
    """PPT p4–p27：AE 的定义、公式、优缺点、应用。"""
    print("[正文] 第 1 步 · 振幅包络 AE：这一帧里最高的那个数")
    print(f"  这一帧 K = {len(TOY)} 个数：{[float(v) for v in TOY]}")

    # PPT 上的公式写的是 max s(k)，没有绝对值。照它算一次。
    ppt = float(np.max(TOY))
    # 实际要用的是「离中线最远」，也就是先取绝对值。
    ours = float(amplitude_envelope(TOY[None, :])[0])
    print(f"  照 PPT 的公式 max s(k)      = {ppt}")
    print(f"  取绝对值之后 max |s(k)|     = {ours}")
    print(f"  两者差 {ours - ppt:.1f}：−0.9 在负方向上比 +0.7 离中线更远，"
          f"它才是这一帧真正的峰")
    print("  PPT 的原话是「max amplitude value」，amplitude 本来就指离零的距离；")
    print("  写成代码时必须补上 abs，否则一帧里最深的那个谷会被漏掉。")
    print("  优缺点（PPT p27）：能粗略反映响度；对离群值敏感。")
    print("  用途（PPT p27）：起音检测、音乐曲风分类。")
    print()
    return ppt, ours


def step2_rms():
    """PPT p28–p35：RMS 的定义、公式三层拆解、优缺点、应用。"""
    print("[正文] 第 2 步 · 均方根 RMS：这一帧整体有多强")
    sq = TOY ** 2
    total = float(np.sum(sq))
    mean = total / len(TOY)
    root = float(rms(TOY[None, :])[0])
    print(f"  ① 每个数平方（PPT：energy of kth sample）")
    print(f"     {[round(float(v), 2) for v in sq]}")
    print(f"  ② 全部加起来（PPT：sum of energy for all samples in frame t）= {total:.2f}")
    print(f"  ③ 除以 K 再开平方（PPT：mean of sum of energy，再取根）")
    print(f"     {total:.2f} / {len(TOY)} = {mean:.4f}，开平方 = {root:.4f}")
    print(f"  直接求平均是 {float(np.mean(TOY)):.4f}——正负互相抵消，量不出强弱；")
    print(f"  先平方就没有负号了，最后开平方把量级换回和原始样本一样。")
    print("  优缺点（PPT p35）：能反映响度；比 AE 更不怕离群值。")
    print("  用途（PPT p35）：音频分段、音乐曲风分类。")
    print()
    return root


def step3_zero_crossing_rate():
    """PPT p36–p49：ZCR 的定义、符号函数、公式、应用。"""
    print("[正文] 第 3 步 · 过零率 ZCR：这一帧穿过中线几次")
    sign = np.sign(TOY).astype(int)
    print(f"  先按 PPT p40 的符号函数把每个数变成 +1 / −1 / 0：")
    print(f"     {[int(v) for v in sign]}")
    pairs = []
    for k in range(len(TOY) - 1):
        d = abs(sign[k] - sign[k + 1]) // 2
        pairs.append(d)
    print(f"  再看相邻两个的符号一样不一样（PPT p44、p46 的两个例子）：")
    print(f"     同号 |(+1)−(+1)| / 2 = 0，异号 |(−1)−(+1)| / 2 = 1")
    print(f"     逐对结果 {[int(v) for v in pairs]}")
    count = sum(pairs)
    print(f"  PPT 的公式到这里就结束了，ZCR_t = {count}，是一个**次数**")
    # librosa 和本课程都返回比例，除数不一样，这里两个都算出来对齐
    by_pairs = count / (len(TOY) - 1)
    by_len = count / len(TOY)
    ours = float(zero_crossing_rate(TOY[None, :])[0])
    print(f"  除以相邻对的个数 {len(TOY) - 1} = {by_pairs:.4f}  ← 本课程 soundlab 的口径")
    print(f"  除以帧长 {len(TOY)}        = {by_len:.4f}  ← librosa 的口径")
    print(f"  soundlab 算出来 {ours:.4f}，和上面第一个对得上")
    # 别只在注释里断言 librosa 用哪个除数，直接调一次让它自己说
    import librosa
    lib = float(librosa.feature.zero_crossing_rate(
        TOY.astype(np.float32), frame_length=len(TOY),
        hop_length=len(TOY), center=False)[0, 0])
    print(f"  librosa 实际算出来 {lib:.4f}，等于 {count}/{len(TOY)}，"
          f"确实是除以帧长")
    hits = int(librosa.zero_crossings(TOY.astype(np.float32), pad=False).sum())
    print(f"  librosa.zero_crossings(pad=False) 数出 {hits} 次，"
          f"和 PPT 的 {count} 一致")
    print("  两个口径差一个 K/(K−1)。帧长 1024 时差 0.1%，可以忽略；")
    print("  但**同一个数据集必须自始至终用同一个口径**，否则两批数字没法比。")
    print("  第 09 课把手写实现和 librosa 对齐时，第一个要对上的就是这个除数。")
    print("  用途（PPT p49）：分辨打击乐与有音高的乐音、单音高估计、语音清浊音判断。")
    print()
    return count, by_pairs, by_len, ours


def step4_three_curves():
    """一小段真实声音：三条曲线各回答一个问题。"""
    print("[正文] 第 4 步 · 换成一小段真实录音，三个数各画一条曲线")
    y, _ = io.load("debussy", seconds=3)
    r = all_three(y)
    print(f"  {len(y)} 个样本，帧长 {FRAME_LENGTH} 帧移 {HOP_LENGTH}，"
          f"切出 {r['n_frames']} 帧")
    for k, label in (("ae", "AE "), ("rms", "RMS"), ("zcr", "ZCR")):
        v = r[k]
        print(f"  {label}  最小 {v.min():.4f}  最大 {v.max():.4f}  "
              f"平均 {v.mean():.4f}")
    # 三条曲线形状相同但彼此不成比例，这一点要能用数说出来
    ae_n = r["ae"] / r["ae"].max()
    rms_n = r["rms"] / r["rms"].max()
    zcr_n = r["zcr"] / r["zcr"].max()
    print(f"  三条曲线都是 {r['ae'].shape[0]} 个点，横轴是同一条时间轴。")
    print(f"  但它们并不是彼此的缩放版：把三条各自除以自己的最大值之后，")
    print(f"    AE 和 RMS 的相关系数 {np.corrcoef(ae_n, rms_n)[0, 1]:.3f}")
    print(f"    AE 和 ZCR 的相关系数 {np.corrcoef(ae_n, zcr_n)[0, 1]:.3f}")
    print(f"    RMS 和 ZCR 的相关系数 {np.corrcoef(rms_n, zcr_n)[0, 1]:.3f}")
    print("  AE 和 RMS 高度同向，因为两个都在量这一帧振动得多大；")
    print("  ZCR 和它们是负相关，而且明显弱一截——它数的是穿过中线的次数，")
    print("  这段钢琴曲越轻的地方底噪占比越高、穿线越密，所以才带上负号。")
    print("  要点不是这个负号有多大，而是：ZCR 量的根本不是同一件事，")
    print("  不能拿它替代 AE 或 RMS，反过来也不行。")
    print()
    return r


def extra_zcr_is_amplitude_blind():
    """正文没放：把整段乘 10，AE 和 RMS 跟着变，ZCR 一个数都不变。"""
    print("[脚本额外] 整段乘以 10，三个数各自变多少")
    y, _ = io.load("debussy", seconds=3)
    a = all_three(y)
    b = all_three(y * 10)
    for k, label in (("ae", "AE "), ("rms", "RMS"), ("zcr", "ZCR")):
        print(f"  {label}  原样 {a[k].mean():.4f}  ×10 后 {b[k].mean():.4f}  "
              f"倍数 {b[k].mean() / a[k].mean():.2f}")
    print("  乘一个正数不会让波形多穿过中线一次，所以 ZCR 一动不动。")
    print("  这条性质第 09 课比较语音和噪声时要用到。")
    print()


def extra_frame_length():
    """正文没放：帧长换一个，三条曲线的平均值各自变多少。"""
    print("[脚本额外] 帧长从 256 换到 4096")
    y, _ = io.load("debussy", seconds=10)
    print(f"  {'帧长':>6}{'帧数':>7}{'AE 平均':>10}{'RMS 平均':>11}{'ZCR 平均':>11}")
    for n in (256, 1024, 4096):
        f = frame(y, n, n // 2)
        print(f"  {n:6d}{f.shape[0]:7d}{amplitude_envelope(f).mean():10.4f}"
              f"{rms(f).mean():11.4f}{zero_crossing_rate(f).mean():11.4f}")
    print("  帧越长，一帧里越容易撞上高峰，所以 AE 平均值一路涨；")
    print("  RMS 和 ZCR 是整帧一起算的，帧长换了它们基本不动。")
    print()


def extra_zcr_threshold():
    """正文没放：底噪把过零率抬高多少，阈值又能压回去多少。"""
    print("[脚本额外] 加一层听不太出来的底噪，过零率被抬高多少")
    y, _ = io.load("debussy", seconds=3)
    rng = np.random.default_rng(0)
    noisy = (y + rng.normal(0, 0.01, len(y))).astype(np.float32)
    print(f"  这段录音本身的均方根是 {float(np.sqrt(np.mean(y ** 2))):.4f}，"
          f"加进去的噪声是 0.0100")
    print(f"  {'零线阈值':>10}{'原录音':>10}{'加噪后':>10}")
    for thr in (0.0, 0.005, 0.01, 0.02):
        z0 = zero_crossing_rate(frame(y), thr).mean()
        z1 = zero_crossing_rate(frame(noisy), thr).mean()
        print(f"  {thr:10.3f}{z0:10.4f}{z1:10.4f}")
    print("  阈值一旦定下，整个数据集必须用同一个值，否则两批数字没法比。")
    print()


if __name__ == "__main__":
    print(f"采样率 {SR}，帧长 {FRAME_LENGTH}，帧移 {HOP_LENGTH}\n")
    step1_amplitude_envelope()
    step2_rms()
    step3_zero_crossing_rate()
    step4_three_curves()
    extra_zcr_is_amplitude_blind()
    extra_frame_length()
    extra_zcr_threshold()

"""第 09 课 · 练习：手写均方根和过零率，再量一量直流偏置和爆音。

对应正文：音频信号处理二十三讲-v2/第06-10课/09-均方根与过零率-先调库再手写然后对齐.md
运行检查：pytest 音频信号处理二十三讲-v2/练习/lesson09

每个函数都吃分好帧的二维数组 frames，形状是 (帧数, 帧长 K)。
分帧用课程工具包里的 soundlab.framing.frame，这里不用自己切。
"""
import numpy as np


# ---------------------------------------------------------------------------
# 练习 1 手写均方根（正文 9.1）
# 每一帧：平方 → 求平均 → 开平方，返回长度等于帧数的一维数组。
# 提示：np.mean(..., axis=1) 是「沿着帧内样本这个方向」求平均。
# ---------------------------------------------------------------------------
def rms(frames: np.ndarray) -> np.ndarray:
    raise NotImplementedError("TODO 1：还没写，按上面的提示完成它")


# ---------------------------------------------------------------------------
# 练习 2 手写过零率（正文 9.3）
# 数相邻两个样本正负号不同的次数，除以相邻对的个数 K-1（本课程的口径）。
# 恰好等于 0 的样本不算正也不算负：先把它们去掉再数。
# ---------------------------------------------------------------------------
def zero_crossing_rate(frames: np.ndarray) -> np.ndarray:
    raise NotImplementedError("TODO 2：还没写，按上面的提示完成它")


# ---------------------------------------------------------------------------
# 练习 3 去掉直流偏置（正文 9.6）
# 返回整段减去自身平均值以后的信号。
# ---------------------------------------------------------------------------
def remove_dc(y: np.ndarray) -> np.ndarray:
    raise NotImplementedError("TODO 3：还没写，按上面的提示完成它")


# ---------------------------------------------------------------------------
# 练习 4 量一声爆音（正文 9.2）
# 把 y 在第 index 个样本改成 ±0.9（正负号跟原来的样本一致，原来是 0 就用 +0.9），
# 分帧以后找出振幅包络变化最大的那一帧，返回 (AE 抬高的倍数, RMS 抬高的倍数)。
# 可以用 soundlab.framing.frame 分帧、soundlab.time_features.amplitude_envelope 算包络，
# 均方根用你在练习 1 写的 rms。
# ---------------------------------------------------------------------------
def click_effect(y: np.ndarray, index: int, frame_length: int = 1024,
                 hop_length: int = 512) -> tuple[float, float]:
    raise NotImplementedError("TODO 4：还没写，按上面的提示完成它")


if __name__ == "__main__":
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[3] / "音频信号处理二十三讲" / "课程代码"))
    from soundlab import io
    from soundlab.framing import frame
    y, sr = io.load("debussy")
    print("前 5 帧均方根", rms(frame(y, 1024, 512))[:5])
    print("爆音效果（AE 倍数, RMS 倍数）", click_effect(y, 10 * sr))

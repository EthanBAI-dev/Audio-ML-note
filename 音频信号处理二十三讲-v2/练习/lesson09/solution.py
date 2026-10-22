"""第 09 课 · 练习参考答案。卡住了再看。"""
import numpy as np

from soundlab.framing import frame
from soundlab.time_features import amplitude_envelope


def rms(frames: np.ndarray) -> np.ndarray:
    return np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1))


def zero_crossing_rate(frames: np.ndarray) -> np.ndarray:
    out = np.zeros(frames.shape[0])
    for i, row in enumerate(np.sign(frames)):
        nz = row[row != 0]
        out[i] = np.count_nonzero(nz[1:] != nz[:-1]) / (frames.shape[1] - 1)
    return out


def remove_dc(y: np.ndarray) -> np.ndarray:
    return y - np.mean(y)


def click_effect(y, index, frame_length=1024, hop_length=512):
    y2 = np.array(y, dtype=np.float64, copy=True)
    y2[index] = -0.9 if y2[index] < 0 else 0.9
    f1, f2 = frame(np.asarray(y, dtype=np.float64), frame_length, hop_length), frame(y2, frame_length, hop_length)
    ae1, ae2 = amplitude_envelope(f1), amplitude_envelope(f2)
    k = int(np.argmax(np.abs(ae2 - ae1)))
    return float(ae2[k] / ae1[k]), float(rms(f2)[k] / rms(f1)[k])

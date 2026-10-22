"""第 03 课 · 参考答案。先自己写，卡住了再看。"""
import numpy as np

I0 = 1e-12


def intensity_to_db(I):
    return 10 * np.log10(I / I0)


def dbfs(y):
    r = float(np.sqrt(np.mean(np.asarray(y, dtype=np.float64) ** 2)))
    return 20 * np.log10(max(r, 1e-12))


def normalize_to(y, target_dbfs):
    return y * 10 ** ((target_dbfs - dbfs(y)) / 20)


def harmonic_ratios(y, sr, f0, n=6):
    seg = np.asarray(y, dtype=np.float64) * np.hanning(len(y))
    S = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / sr)

    def peak_near(target, tol=0.03):
        m = (f > target * (1 - tol)) & (f < target * (1 + tol))
        return float(S[m].max()) if m.any() else 0.0

    base = peak_near(f0)
    return [peak_near(f0 * k) / base for k in range(1, n + 1)]

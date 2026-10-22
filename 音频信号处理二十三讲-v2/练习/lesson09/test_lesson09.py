"""第 09 课 · 自动检查。数据都来自课程音频，和正文是同一批数。"""
import numpy as np
import pytest

from soundlab import io
from soundlab.framing import frame

K, H = 1024, 512


@pytest.fixture(scope="module")
def debussy():
    return io.load("debussy", seconds=3)[0]


def test_rms_matches_librosa(ex, debussy):
    """练习 1：手写均方根和 librosa 逐帧最大差 < 1e-6"""
    import librosa
    lib = librosa.feature.rms(y=debussy, frame_length=K, hop_length=H, center=False)[0]
    mine = np.asarray(ex.rms(frame(debussy, K, H)))
    assert mine.shape == lib.shape, f"形状不对：你的是 {mine.shape}，librosa 是 {lib.shape}"
    assert np.max(np.abs(mine - lib)) < 1e-6, "数值对不上：检查是不是先平方、再沿 axis=1 求平均、再开方"


def test_zcr_ratio_is_k_over_k_minus_1(ex, debussy):
    """练习 2：手写过零率 ÷ librosa = K/(K-1)"""
    import librosa
    lib = librosa.feature.zero_crossing_rate(debussy, frame_length=K, hop_length=H, center=False)[0]
    mine = np.asarray(ex.zero_crossing_rate(frame(debussy, K, H)))
    ratio = float(np.median(mine / np.maximum(lib, 1e-12)))
    assert abs(ratio - K / (K - 1)) < 1e-6, f"比值是 {ratio:.6f}，应该是 {K / (K - 1):.6f}：分母要用 K-1"


def test_zcr_simple_cases(ex):
    """练习 2：几个能手算的小例子"""
    f = np.array([[1.0, -1.0, 1.0, -1.0], [1.0, 1.0, 1.0, 1.0], [1.0, 0.0, -1.0, 0.0]])
    assert np.allclose(ex.zero_crossing_rate(f), [1.0, 0.0, 1 / 3]), "交替正负应得 1，全正得 0；0 先去掉再数"


def test_remove_dc_restores_zcr(ex):
    """练习 3：先减平均值，过零率就不再受整体偏移影响"""
    y = io.peak_normalize(io.load("voice", seconds=3)[0])
    assert abs(float(np.mean(ex.remove_dc(y)))) < 1e-6, "减完以后整段平均值应该是 0"
    lifted = np.mean(ex.zero_crossing_rate(frame(y + 0.05, 400, 160)))
    a = np.mean(ex.zero_crossing_rate(frame(ex.remove_dc(y), 400, 160)))
    b = np.mean(ex.zero_crossing_rate(frame(ex.remove_dc(y + 0.05), 400, 160)))
    assert lifted < a * 0.8, "抬高以后过零率应该明显变小，先确认练习 2 写对了"
    assert abs(b / a - 1) < 0.01, f"抬没抬高，减完平均值都该一样；现在差了 {abs(b / a - 1):.1%}"


def test_click_effect(ex):
    """练习 4：一声爆音让 AE 翻好几倍，RMS 只多一点"""
    y, sr = io.load("debussy")
    ae_x, rms_x = ex.click_effect(y, 10 * sr)
    assert ae_x == pytest.approx(4.58, abs=0.02), f"AE 倍数是 {ae_x:.2f}，正文实测 4.58"
    assert rms_x == pytest.approx(1.089, abs=0.003), f"RMS 倍数是 {rms_x:.3f}，正文实测 1.089"

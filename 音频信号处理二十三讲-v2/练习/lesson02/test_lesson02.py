"""第 02 课 · 自动检查。数字和正文、lesson02_pitch_and_hz.py 的输出一致。"""
import numpy as np
import pytest


def test_sine(ex):
    """练习 1：1 秒 440 Hz 正弦穿过中线约 880 次，最高处等于振幅"""
    x = np.asarray(ex.sine(440, 0.5, 0.3, 22050, 1.0))
    assert x.shape == (22050,), f"1 秒 22050 Hz 应有 22050 个点，你的是 {x.shape}"
    assert abs(np.max(np.abs(x)) - 0.5) < 1e-3, "最高处应等于振幅 0.5"
    crossings = int(np.sum(np.signbit(x[1:]) != np.signbit(x[:-1])))
    assert abs(crossings - 880) <= 2, f"穿过中线 {crossings} 次，应约 880 次：频率写对了吗"
    assert abs(x[0] - 0.5 * np.sin(0.3)) < 1e-9, "t=0 时应等于 amp*sin(phase)"


def test_midi_to_hz(ex):
    """练习 2：60 号是 261.63 Hz，加 12 正好乘 2，A4=442 时差 7.9 音分"""
    assert ex.midi_to_hz(69) == pytest.approx(440.0)
    assert ex.midi_to_hz(60) == pytest.approx(261.63, abs=0.01)
    for m in (60, 69, 72, 81):
        assert ex.midi_to_hz(m + 12) / ex.midi_to_hz(m) == pytest.approx(2.0)
    assert 1200 * np.log2(ex.midi_to_hz(60, a4=442) / ex.midi_to_hz(60)) == pytest.approx(7.85, abs=0.05)


def test_hz_to_midi(ex):
    """练习 3：倒过来；小提琴 260.3 Hz 是 59.9"""
    assert ex.hz_to_midi(440) == pytest.approx(69.0)
    assert ex.hz_to_midi(523.25) == pytest.approx(72.0, abs=1e-3)
    assert round(float(ex.hz_to_midi(260.3)), 1) == 59.9


def test_cents(ex):
    """练习 4：高 1% 在哪个音区都是 17.23；110 加 100 Hz 是 1119.5，1760 加 100 Hz 是 95.7"""
    for f in (220, 440, 880):
        assert ex.cents(f, f * 1.01) == pytest.approx(17.23, abs=0.01)
    assert ex.cents(110, 210) == pytest.approx(1119.5, abs=0.1)
    assert ex.cents(1760, 1860) == pytest.approx(95.7, abs=0.1)
    assert ex.cents(440, 880) == pytest.approx(1200.0)

"""第 03 课 · 自动检查。数字和正文、lesson03_loudness.py 的输出一致。"""
import numpy as np
import pytest

from soundlab import io

SR = 22050


def test_intensity_to_db(ex):
    """练习 1：听阈 0 dB，痛阈 130 dB，翻一倍约加 3 dB"""
    assert ex.intensity_to_db(1e-12) == pytest.approx(0.0, abs=1e-9)
    assert ex.intensity_to_db(10.0) == pytest.approx(130.0)
    assert ex.intensity_to_db(1e-6) == pytest.approx(60.0)
    assert ex.intensity_to_db(2e-6) - ex.intensity_to_db(1e-6) == pytest.approx(3.01, abs=0.01)


def test_dbfs(ex):
    """练习 2：满幅正弦约 -3.01 dBFS；振幅减半低 6.02 dB"""
    t = np.arange(SR) / SR
    s = np.sin(2 * np.pi * 220 * t)
    assert ex.dbfs(s) == pytest.approx(-3.01, abs=0.01)
    assert ex.dbfs(s) - ex.dbfs(0.5 * s) == pytest.approx(6.02, abs=0.01)


@pytest.mark.parametrize("name,before", [("debussy", -24.41), ("duke", -21.33), ("redhot", -20.81)])
def test_normalize_to(ex, name, before):
    """练习 3：三段主素材（前 10 秒）统一到 -20 dBFS，形状不变"""
    y = io.load(name, seconds=10)[0]          # 和脚本一样取前 10 秒
    assert ex.dbfs(y) == pytest.approx(before, abs=0.01), "原电平和正文对不上：先检查练习 2"
    z = np.asarray(ex.normalize_to(y, -20.0))
    assert ex.dbfs(z) == pytest.approx(-20.0, abs=1e-3)
    k = z[np.argmax(np.abs(y))] / y[np.argmax(np.abs(y))]
    assert np.allclose(z, y * k, atol=1e-6), "统一电平只能整段乘一个数，形状不能变"


def test_harmonic_ratios(ex):
    """练习 4：已知泛音比例 1 : 0.5 : 0.25 的合成音，量出来要对上"""
    t = np.arange(SR) / SR
    y = sum(a * np.sin(2 * np.pi * 262 * k * t) for k, a in ((1, 1.0), (2, 0.5), (3, 0.25)))
    r = ex.harmonic_ratios(y, SR, 262, n=4)
    assert len(r) == 4
    assert r[0] == pytest.approx(1.0)
    assert r[1] == pytest.approx(0.5, abs=0.02)
    assert r[2] == pytest.approx(0.25, abs=0.02)
    assert r[3] < 0.02, "第 4 倍上没有东西，量出来应接近 0"

"""第 01 课 · 自动检查。数都来自课程音频，和正文是同一批。"""
import os

import numpy as np

from soundlab.config import audio_dir

A = audio_dir()
MAIN = [os.path.join(A, f) for f in ("debussy.wav", "duke.wav", "redhot.wav")]
REFS = [os.path.join(A, f) for f in ("noise.wav", "piano_c.wav", "sax.wav", "scale.wav",
                                     "tremolo.wav", "violin_c.wav", "voice.wav")]
VOICE = os.path.join(A, "voice.wav")


def test_describe(ex):
    """练习 1：voice.wav 是 30 秒、22050 Hz、单声道、661500 个时刻"""
    d = ex.describe(VOICE)
    assert d["sample_rate_hz"] == 22050 and d["channels"] == 1, f"格式读错了：{d}"
    assert d["n_frames"] == 661500, f"总数应是 661500，你的是 {d['n_frames']}"
    assert abs(d["duration_s"] - 30.0) < 1e-6


def test_seconds_to_count(ex):
    """练习 2：1 秒音乐片段在 22050 Hz 下是 22050 个数"""
    assert ex.seconds_to_count(1, 22050) == 22050
    assert ex.seconds_to_count(30, 22050) == 661500
    assert ex.seconds_to_count(0.5, 44100) == 22050


def test_same_format(ex):
    """练习 3：三段主素材格式一致，七段对照素材不一致"""
    assert ex.same_format(MAIN) is True, "三段主素材都是 22050 Hz 单声道，应该是 True"
    assert ex.same_format(REFS) is False, "对照素材有三种每秒记录次数，应该是 False"


def test_peek(ex):
    """练习 4：和正文 1.1 的 8 个数对上"""
    got = np.asarray(ex.peek(VOICE, 1.0, 8))
    want = np.array([0.0331, 0.0280, 0.0277, 0.0327, 0.0370, 0.0366, 0.0318, 0.0245])
    assert got.shape == (8,), f"应该取出 8 个数，你取出的形状是 {got.shape}"
    assert np.max(np.abs(got - want)) < 6e-5, f"数对不上：{np.round(got, 4)}"

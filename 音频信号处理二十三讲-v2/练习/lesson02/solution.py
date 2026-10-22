"""第 02 课 · 参考答案。先自己写，卡住了再看。"""
import numpy as np


def sine(f, amp, phase, sr, seconds):
    t = np.arange(int(round(sr * seconds))) / sr
    return amp * np.sin(2 * np.pi * f * t + phase)


def midi_to_hz(m, a4=440.0):
    return a4 * 2 ** ((m - 69) / 12)


def hz_to_midi(f, a4=440.0):
    return 69 + 12 * np.log2(f / a4)


def cents(f1, f2):
    return 1200 * np.log2(f2 / f1)

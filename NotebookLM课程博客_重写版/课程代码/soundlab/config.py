# -*- coding: utf-8 -*-
"""全课程共用的参数，只在这里写一次。

这些数字改任何一个，特征表就不能和之前算出来的比较。所以它们必须集中在
一个地方，而不是散落在各个函数的默认参数里——这是课程的第一条纪律。
"""
import os

# 每秒记录多少个数字。librosa 的默认值就是 22050，全课程沿用。
SR = 22050

# 一帧看多长、隔多久看一次，单位都是样本数。
# 1024 / 22050 = 46.4 毫秒，512 / 22050 = 23.2 毫秒。
FRAME_LENGTH = 1024
HOP_LENGTH = 512

# 语音类任务常用的另一组。400 / 160 这对数字出自 16 kHz 的语音惯例
# （25 与 10 毫秒）；在本课程的 22050 Hz 下，它们覆盖 18.1 与 7.3 毫秒。
# 沿用同一对样本数，是为了和语音领域的现成代码对得上。
SPEECH_FRAME_LENGTH = 400
SPEECH_HOP_LENGTH = 160

# 统一响度时把每段拉到的电平，单位 dBFS（见第 03 课）。
TARGET_DBFS = -20.0


def audio_dir():
    """找到那十段课程音频。

    按顺序试三个位置：环境变量 SOUNDLAB_AUDIO、工作目录下的 audio/、
    仓库里的 source_course/audio_resources/。
    """
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for cand in (
        os.environ.get("SOUNDLAB_AUDIO"),
        os.path.join(os.getcwd(), "audio"),
        os.path.join(here, "..", "..", "source_course", "audio_resources"),
    ):
        if cand and os.path.isdir(cand):
            return os.path.abspath(cand)
    raise FileNotFoundError(
        "找不到音频目录。把 source_course/audio_resources/*.wav 复制到 audio/ 下，"
        "或者设环境变量 SOUNDLAB_AUDIO 指向它们。"
    )

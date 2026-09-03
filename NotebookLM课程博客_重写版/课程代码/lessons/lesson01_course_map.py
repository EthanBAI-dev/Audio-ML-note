# -*- coding: utf-8 -*-
"""第 01 课 · 先把课程问题和音频素材认清楚。

跑法（在 project/ 目录下）：
    python lessons/lesson01_course_map.py

这一课不分析波形、频谱或声谱图。它只完成课程导论对应的第一步：
明确要解决的分类问题，并确认三段主素材可以被程序正常读取。
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import soundfile as sf


COURSE_AUDIO = [
    ("debussy.wav", "古典"),
    ("duke.wav", "爵士"),
    ("redhot.wav", "摇滚"),
]

REFERENCE_AUDIO = [
    "noise.wav",
    "piano_c.wav",
    "sax.wav",
    "scale.wav",
    "tremolo.wav",
    "violin_c.wav",
    "voice.wav",
]


def audio_dir():
    """找到课程音频，但不导入后面课程才需要的 librosa。"""
    course_code = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for candidate in (
        os.environ.get("SOUNDLAB_AUDIO"),
        os.path.join(os.getcwd(), "audio"),
        os.path.join(course_code, "..", "..", "source_course", "audio_resources"),
    ):
        if candidate and os.path.isdir(candidate):
            return os.path.abspath(candidate)
    raise FileNotFoundError(
        "找不到音频目录。把 source_course/audio_resources/*.wav 复制到 audio/ 下，"
        "或者设环境变量 SOUNDLAB_AUDIO 指向它们。"
    )


def inspect_course_audio():
    """读取文件头，不先改变采样率或声道，避免把原始素材状况藏起来。"""
    rows = []
    folder = audio_dir()
    for filename, label in COURSE_AUDIO:
        info = sf.info(os.path.join(folder, filename))
        rows.append(
            {
                "file": filename,
                "label": label,
                "duration_s": info.duration,
                "sample_rate_hz": info.samplerate,
                "channels": info.channels,
            }
        )
    return rows


def write_manifest(rows, target="dataset_manifest.csv"):
    """把任务约定写成表，后面的课都从同一份文件名和标签出发。"""
    with open(target, "w", newline="", encoding="utf-8-sig") as stream:
        writer = csv.DictWriter(stream, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def main():
    rows = inspect_course_audio()

    print("[正文] 课程要解决的问题")
    print("  输入：1 秒音乐片段")
    print("  输出：古典、爵士、摇滚中的一个标签")
    print("  本系列先完成可信的音频特征，")
    print("  不把训练深度模型当作终点。")
    print()

    print("[正文] 三段主素材")
    for row in rows:
        print(f"  {row['file']} | {row['label']}")
        print(
            f"    {row['duration_s']:.2f} 秒 | "
            f"{row['sample_rate_hz']} Hz | {row['channels']} 声道"
        )
    print("  三个文件都能读取，")
    print("  课程项目才有共同的起点。")
    print()

    write_manifest(rows)
    print("[正文] 已写出 dataset_manifest.csv")
    print(f"  共 {len(rows)} 行主素材；")
    print("  后续脚本沿用这里的文件名和标签。")
    print()

    print("[脚本额外] 七段对照素材")
    print("  " + "、".join(REFERENCE_AUDIO))
    print("  它们用于音高、音色、颤音、语音与噪声实验，不加入三分类标签表。")


if __name__ == "__main__":
    main()

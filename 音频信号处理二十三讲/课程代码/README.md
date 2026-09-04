# 课程代码：每一课的实验，都能自己跑一遍

> **一句话：** 文章里出现的每一个数字，都能在这里对应的脚本输出里找到同一个；脚本比文章更全，多出参数扫描、边界检查和画图。

课程正文只留说明问题必需的那几行代码。想照着读就读正文，想动手就跑这里的脚本。

## 怎么开始

需要 Python 3.10 或更新的版本。

```bash
python -m pip install -r requirements.txt
```

把课程音频和这两个目录放到一起：

```bash
mkdir -p project/audio
cp source_course/audio_resources/*.wav project/audio/
cp -r 课程代码/soundlab 课程代码/lessons project/
cd project
python lessons/lesson01_course_map.py
```

脚本按顺序找音频目录：环境变量 `SOUNDLAB_AUDIO` → 当前目录下的 `audio/` → 仓库里的 `source_course/audio_resources/`。所以在仓库根目录下直接跑也可以：

```bash
python 音频信号处理二十三讲/课程代码/lessons/lesson07_three_time_features.py
```

## 目录结构

| 路径 | 里面是什么 |
|---|---|
| `soundlab/` | 一课加一点的工具包，正文里写过的函数最后都收在这里 |
| `lessons/` | 每课一个脚本，跑一次就打印出正文那一节的全部输出 |

### `soundlab/` 现在有什么

| 模块 | 内容 | 来自哪一课 |
|---|---|---|
| `config.py` | 采样率、帧长、帧移、统一电平的目标值 | 04、06 |
| `io.py` | 读音频、峰值归一化、按 dBFS 统一电平 | 02、03 |
| `framing.py` | 分帧、加窗、帧数与尾巴、帧的时间轴 | 06、08 |
| `time_features.py` | 振幅包络、均方根、过零率、聚合 | 07、08、09 |
| `probe.py` | 用已知频率去试探：读数、强度、相位、扫频 | 10 |
| `spectral.py` | 单边 FFT、Hz 频率轴、STFT、功率声谱图、频谱数据池化 | 14、15 |
| `frequency_features.py` | BER、分界格、频谱质心、$p=1/2$ 频谱带宽 | 21—23 |
| `figdata.py` | 把脚本实测数据写成配图读取的 JSON | 贯穿各课 |

第 17—20 课的梅尔与倒谱部分直接写在各自的课程脚本里；第 21—23 课共用的频谱统计已经收进 `frequency_features.py`。

### `lessons/` 现在有什么

| 脚本 | 对应课 | 实验回答什么问题 |
|---|---|---|
| `lesson01_course_map.py` | 01 | 课程要分辨什么，三段主素材能否读取、标签是否固定 |
| `lesson01_three_views.py` | 旧 01 实验，待迁移 | 这段代码提前使用频谱和声谱图；当前不再作为第 01 课入口，迁移完成前暂时保留 |
| `lesson02_pitch_and_hz.py` | 02 | 琴键编号和赫兹怎么换算，编号加 12 是不是真的翻一倍 |
| `lesson03_loudness.py` | 03 | 两段 RMS 精确相同的声音，为什么听起来不一样响 |
| `lesson04_sampling_and_bitdepth.py` | 04 | 三个不同的频率怎样被压成同一条曲线 |
| `lesson05_feature_choices.py` | 05 | 「整段求平均」到底删掉了什么 |
| `lesson06_framing.py` | 06 | 1 秒切成几帧，加窗和聚合各改变了什么 |
| `lesson07_three_time_features.py` | 07 | 三个时域特征里，哪一个真的分得开三种风格 |
| `lesson08_amplitude_envelope.py` | 08 | 振幅包络怎么写才对得准时间轴 |
| `lesson09_rms_zcr.py` | 09 | 「两个特征一起看更好」到底好多少 |
| `lesson10_fourier_intuition.py` | 10 | 只用乘法和平均，能不能把两个频率挑出来 |
| `lesson11_complex.py` | 11 | 一个复数怎样同时装下强度和起点 |
| `lesson12_complex_ft.py` | 12 | 复数形式的傅里叶变换能否完整往返 |
| `lesson13_dft.py` | 13 | 有限个样本怎样变成可逆的有限 DFT，FFT 快多少 |
| `lesson14_fft_spectrum.py` | 14 | 四段真实声音怎样变成可正确读取 Hz 横轴的低频幅度谱 |
| `lesson15_stft.py` | 15 | 移动短窗怎样找回时间，矩阵形状 501 × 19 从哪来 |
| `lesson16_spectrogram.py` | 16 | 同一批数换上色方式和纵轴刻法，能多看见多少 |
| `lesson17_mel_scale.py` | 17 | 按听感刻的尺子长什么样，十个三角形怎样把 1025 行压成 10 行 |
| `lesson18_mel_spectrogram.py` | 18 | 库造的滤波器组和手写的差在哪三个默认值上 |
| `lesson19_cepstrum.py` | 19 | 相乘的两样东西，能不能按变化快慢分到一根轴的两端 |
| `lesson20_mfcc.py` | 20 | 一行 `librosa.feature.mfcc` 等于哪四步，delta 沿哪个轴 |
| `lesson21_freq_features.py` | 21 | 三个频域统计量分别回答什么，质心与带宽能否独立变化 |
| `lesson22_band_energy_ratio.py` | 22 | 2000 Hz 应切在第几格，矩阵轴写错会让 BER 偏多少 |
| `lesson23_centroid_bandwidth.py` | 23 | 手写质心和两种带宽能否与库函数逐帧对齐 |

## 输出怎么读

每个脚本的输出分两类：

- **`[正文]`** —— 文章里出现过的段落。这些数字必须和文章一字不差，对不上就是有一边错了。
- **`[脚本额外]`** —— 文章放不下的部分：参数扫描、耗时对比、边界情况。它们不影响文章的结论，但值得自己跑一遍。

## 三条纪律

1. **参数集中在 `config.py`。** 采样率、帧长、帧移、窗函数、统一电平的目标值，任何一个改了，之前算出的特征表就不能和新的比。
2. **先检查形状，再看数值。** 每写完一个函数先打印 `shape`，确认哪一维是时间、哪一维是频率。方向写反是这门课最常见的错误，而且不报错。
3. **每一步都要能解释。** 一个数字算出来了但你说不清它代表什么，它对最终判断就没有价值。

## 相关文档

- [课程总纲](../课程总纲/README.md) —— 环境准备、23 课的路线图
- [课程项目：三首曲子，一个分类器](../课程项目/README.md) —— 这些代码最后要拼成什么

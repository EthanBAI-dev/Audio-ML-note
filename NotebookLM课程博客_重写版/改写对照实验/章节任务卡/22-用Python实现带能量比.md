# 第 22 课任务卡：用 Python 实现带能量比

- 源文件与范围：
  - 可执行主线：`source_course/22 - Implementing Band Energy Ratio from Scratch with Python/Implementing band energy ratio from scratch with Python.ipynb`，18 个单元格。
  - 逐格文字：`NotebookLM课程博客_重写版/PPT内容/22-Implementing-Band-Energy-Ratio-from-Scratch-with-Python.md`。
  - 补充参考：`notebooklm博客/ダウンロード (12).md`，是 Markdown 博客稿，不是 `.ipynb`。
- 上一课交进来：BER 是分界频率以下的功率和除以上方的功率和，每帧得到一个数。
- 读者问题：2000 Hz 到底落在 STFT 的第几格，代码应该沿矩阵哪一维累计？
- 一句话结果：先用 `rfftfreq` 建立真实 Hz 频率轴，再用 `searchsorted` 找第一个不低于 2000 Hz 的格；低侧取 `< 2000 Hz`，高侧取 `>= 2000 Hz`，然后沿频率轴逐帧求和。
- 本课拥有的新概念：分界格的边界约定；频率格 × 时间帧的求和方向；BER 原始倍数与 dB 表示；高频能量为零时的处理。
- 只回顾：STFT 与功率谱回链第 15—16 课；BER 的意义和公式回链第 21 课。
- 明确留给后课：质心和带宽的实现留给第 23 课；本课不顺手实现它们。
- 按源 Notebook 排列的讲解块：
  1. 载入 debussy、redhot、duke 三段音乐。
  2. 设 `FRAME_SIZE=2048`、`HOP_SIZE=512`，分别计算 STFT。
  3. 写“分界频率 → 分界格”的函数。
  4. 写逐帧 BER，三段各计算一次。
  5. 用 `frames_to_time` 把横轴换成秒，画三条曲线。
- 必要校正：
  - 源 Notebook 的 `band_energy_ratio` 把 `len(spectrogram[0])` 当成频率格数；对 `(频率格, 时间帧)` 矩阵来说它其实是时间帧数，会把 2000 Hz 错切到更高的实际频率。
  - 源辅助函数用 `Nyquist / num_bins` 当格距，少考虑了端点。正文采用 `np.fft.rfftfreq` 直接生成真实频率轴，不靠近似格距。
  - 比值跨越很大时用 `10 log10(BER)` 作图；公式与代码仍保留原始 BER，避免把“比值”和“分贝”混成一个概念。
- 实验问题：同一个 2000 Hz 分界，轴写对与写错会让三段音乐的 BER 曲线差多少？
- 验收标准：
  1. 打印 STFT 形状，明确 1025 行是频率、1292 列是时间。
  2. 打印近似函数、正确函数和错误轴调用得到的格号，以及这些格在真实轴上对应的 Hz。
  3. 向量化结果与显式逐帧求和最大差接近浮点误差。
  4. 打印三段音乐 BER(dB) 的中位数和四分位区间，并扫描多个分界频率证明它是参数。
  5. 所有正文数字和配图来自同一次 `--dump`。
- 代码：`NotebookLM课程博客_重写版/课程代码/lessons/lesson22_band_energy_ratio.py`（已完成）；公共函数收进 `soundlab/frequency_features.py`。
- 配图：
  - `22-ber-axis-contract.svg`：频率格 × 时间帧矩阵，沿行分成低、高两块，再按列各得到一个比值。
  - `22-split-bin-bug.svg`：2000 Hz 的正确分界与两个错误格号在真实 Hz 轴上的位置。
  - `22-ber-tracks-new.svg`：三段真实音乐的 BER(dB) 时间曲线。
  - `22-threshold-scan.svg`：不同分界频率下三段录音的中位 BER(dB)，用折线与数据点，不用柱状图。
- 下一课链接：已链接到第 23 课 B 草稿。

## 零基础与术语自查

- “沿频率轴求和”要配矩阵方向图，不能只靠 `axis=0`。
- 正值 dB 表示低频功率更多，负值表示高频功率更多，0 dB 表示两边一样多。
- 只说这三段录音的实测差异，不从三个样本推断整个音乐流派。
- 不在正文提及源文件、幻灯片、Notebook 或制作过程。

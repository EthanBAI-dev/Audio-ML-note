# 第 20 课任务卡：用 Python 取 MFCC

- 源文件与范围：
  - 主线：`source_course/20 - Extracting MFCCs with Python/Extracting MFCCs.ipynb`，18 个单元格。主线只有可执行的 Jupyter Notebook（`.ipynb`），没有配套 PDF。
  - 逐格原文：`NotebookLM课程博客_重写版/PPT内容/20-Extracting-MFCCs-with-Python.md`
  - NotebookLM 补充博客稿：`notebooklm博客/ダウンロード (15).md`。这是 Markdown 参考稿，不是 `.ipynb`。**编号对不上，是按内容认出来的**（开头是「揭秘声音的『指纹』：如何利用 Python 提取 MFCC 特征」）。它补上三件 `.ipynb` 里没写的：`librosa.load` 默认重采样到 22050；一阶差分叫「速度」、二阶叫「加速度」；39 维矩阵是喂给 CNN / RNN 的输入形态。
- 上一课交进来：读者已经手写过整条链——取对数、再变换一次、提升、DCT 去相关，并且知道前 13 个系数装下原谱 98.2% 的变化。第 19 课结尾留的话是：「下一课把这一步交给库……然后照例，把它和这一课手写的这套摆在一起对齐。」
- 读者问题：原理都手写验证过了，那一行 `librosa.feature.mfcc` 到底替我做了哪几步？它和我自己走三步的结果一样吗？
- 一句话结果：一行 `librosa.feature.mfcc(y, sr, n_mfcc=13)` 等于「梅尔谱 → `power_to_db` → DCT-II 正交 → 取前 13 行」，逐位对齐要先改对 `n_mels`；`librosa.feature.delta` 不是相邻两帧相减，而是沿**时间轴**的九帧回归，改一帧会牵动九列；13 + 13 + 13 拼成每帧 39 行。
- 本课拥有的新概念：`librosa.feature.mfcc` 与它的默认值（`n_mels=128`、`dct_type=2`、`norm='ortho'`、`lifter=0`、`power_to_db` 的 `top_db=80`）；`librosa.feature.delta` 与 `width=9` 的回归求导；`order=2`；`np.concatenate` 拼 39 行；第 0 个系数是整体电平这件事。
- 只回顾或预告：倒谱、倒频率、提升、DCT 的四个理由、为什么取 12—13 个——**全部是第 19 课的，只回顾不重讲**；梅尔滤波器组回链第 17 课；`melspectrogram` 与 `power_to_db` 回链第 18 课；帧数算式回链第 15 课；「特征分不分得开三种风格」回链第 07、09 课。
- 明确留给后课：频域特征（带能量比、谱质心、谱带宽）留给第 21—23 课。**本课不算任何谱形状统计量。**
- 按源材料排列的讲解块：
  1. cell 1—5 载入 `debussy.wav`，看采样率与长度。
  2. cell 6—8 `librosa.feature.mfcc(y=signal, n_mfcc=13, sr=sr)`，看 shape。
  3. cell 9—10 画 MFCC 热力图。
  4. cell 11—14 `librosa.feature.delta(mfccs)` 与 `order=2`，看 shape。
  5. cell 15—16 画两张导数图。
  6. cell 17—18 `np.concatenate` 拼成 39 行，看 shape。
- 编辑补充（Notebook 打印完 shape 就翻篇）：
  - **正题是对齐。** Notebook 从没验证过这一行等于什么。要照第 18 课那张四阶段表的写法，把「自己走三步」和库的结果摆在一起，逐个默认值改，每次重量一次最大差。**预期第一个绊脚石是 `n_mels`**：第 19 课手写用的是 40，库默认 128。
  - **`power_to_db` 的 `top_db=80` 是暗桩。** 它按整段最大值截断，被截掉的格子会改变 DCT 的输入。要量出截掉了多少格、关掉截断后 MFCC 差多少。
  - **delta 不是 `np.diff`。** Notebook 和补充材料都写成「$d_t = c_{t+1} - c_t$」，实际是 `width=9` 的 Savitzky–Golay 回归。要用扰动实验证明：**只改第 t 帧，delta 会变第 t−4 到 t+4 共九列**；同时量出它和 `np.diff` 的相关性。
  - **补充材料有一处不能照抄**：它说 MFCC 图的 colorbar 单位是 dB。DCT 之后的系数不是分贝，dB 停在 `power_to_db` 那一步；本课的图不标 dB。
- 实验问题：那一行库函数替我做了哪几步，做得和我手写的一样吗？
- 验收标准：
  1. `mfccs.shape`、`delta.shape`、`delta2.shape`、拼接后的 shape 四个都打印，帧数与第 15 课的算式对得上。
  2. 「自己走三步」与 `librosa.feature.mfcc` 的最大差，按默认值逐个对齐，每一阶段一行，全部打印。
  3. `top_db` 截断影响的格子数与关掉后的 MFCC 差值，打印。
  4. 扰动一帧之后 delta 发生变化的列范围，打印列号；与 `np.diff` 的相关系数，打印。
  5. debussy / redhot / duke 在前几个系数上的均值与标准差，以及哪几个系数真的分得开，打印。
  6. 所有正文数字和配图来自同一次 `--dump`。
- 代码：`NotebookLM课程博客_重写版/课程代码/lessons/lesson20_mfcc.py`（待建）。音频用 `debussy.wav`（源 Notebook 用的就是它），三种风格对比再加 `redhot.wav`、`duke.wav`，都取前 30 秒。
- 必须输出：四个 shape；对齐阶段表；`top_db` 的影响；delta 的扰动范围与 `np.diff` 相关性；三种风格的系数均值。
- 配图（加进 `tools/build-figures-16-20-ppt.mjs`，**名字不要撞上旧稿的 `20-boundary.svg`、`20-concat.svg`、`20-delta.svg`、`20-mfcc-map.svg`**）：
  - `20-align-stages.svg`：逐个默认值对齐的阶段表，每一阶段一条横条表示最大差（对数刻度），标出是哪个参数救了它。
  - `20-thirteen-rows.svg`：13 行 MFCC 的热力图，纵轴是系数序号；旁边标出第 0 行为什么和其他行不是一类东西。
  - `20-delta-along-time.svg`：扰动一帧之后，MFCC 只变一列、delta 变九列——两张对照，把「沿时间轴」画出来。
  - `20-three-genres.svg`：三种风格前 13 个系数的均值曲线，带正负一个标准差的带子；**用曲线和数据点，不用柱状图**。
- 现有材料处理：`零基础版_16-20/` 里的旧图不覆盖、不改名。
- 下一课链接：**已完成。**第 19 课结尾已经链接到本文；第 21 课创建前，本文结尾只写普通文字预告，不制造死链。

## 零基础与术语自查

- **「一行代码等于四步」要先说清是哪四步**，再去对齐。读者刚手写过这四步，回顾用一句话带过即可，不要重讲原理。
- **「默认值」这个词要落到具体后果上**：不是「库和我不一样」，而是「库默认切 128 条梅尔带，我切的是 40 条，输给 DCT 的原料根数就不同」。
- **「回归求导」不要展开讲 Savitzky–Golay**。只讲它在这里的唯一后果：一帧的改动会摊到附近九帧上，所以 delta 比逐帧相减平滑，也因此**慢半拍**。
- **「39 维」要说清是每帧 39 个数，不是整段 39 个数。** 补充材料把 `(39, 1292)` 写成「39 维特征向量」，读者容易以为整段只有 39 个数。
- **第 0 个系数**要点明它装的是整体电平，很多流水线会把它扔掉——但这是观察结论，要拿相关系数说话，不要写成惯例。
- 不要写「MFCC 是理想输入」「黄金标准」这类评价。

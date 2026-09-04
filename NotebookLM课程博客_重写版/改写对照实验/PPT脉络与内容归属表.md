# PPT 脉络与内容归属表（01—15）

> 版本：2026-09-03。本文是 01—10 重写的结构依据。先按源 PPT / notebook 确定“这一课为什么接在上一课后面”，再决定博客怎样讲得更容易懂。教程模板只能改善表达，不能改写课程顺序。

## 使用规则

1. **源 PPT / notebook 是课程骨架。** `原始素材大纲.md` 只负责快速检索；真正定顺序时必须直接看 PDF 的逐页演示和 notebook 的单元格顺序。
2. **博客可以补台阶，不能抢跑。** 为零基础读者补一句前置解释、一个小例子或一张图是允许的；提前完整讲授后续课程的概念不允许。
3. **每课只解决源材料提出的那组问题。** FAQ、速查表、工程注意和项目扩展都不是必选结构，不能为了套模板重复正文。
4. **实验沿着源材料走。** 概念课使用最小验证；实现课按 notebook 的读取、计算、画图、比较顺序展开。仓库脚本可以更全面，但正文先完成源实验。
5. **图跟着推理出现。** 时间和频率都是连续轴，使用曲线、波形或谱线，不用柱状图；柱状图只用于离散类别比较。

## 01—15 的课程主线

| 课 | 必须读取的源文件 | 源材料的讲解顺序 | 当前草稿的主要偏差 | 重写后的实验与代码 |
| --- | --- | --- | --- | --- |
| 01 课程导论 | `source_course/01 - Overview/Audio Signal Processing for Machine Learning.pdf` | 图片分类问题 → 声音分类为什么需要音频处理 → 应用 → 23 课内容地图 → 理论与代码 → 工具 → 学习目标、读者和前置知识 | **已修复：**已按 PPT 13 页的顺序重写，文件名同步改成 `01-课程导论-…`（4 处链接已跟改）。补回了原先漏掉的 p12「别被数学吓到」和 p13「这门课写给谁」；p2/p3 的对比也改回 PPT 的原意——猫的**照片**对汽车的**声音**，不是猫照片对狗照片 | 已建立三种音乐的分类任务和素材清单，只检查文件、标签、时长、采样率；`lesson01_course_map.py` 已实测，旧 `lesson01_three_views.py` 保留到迁移完成 |
| 02 声音与波形 | `source_course/02 - Sound and waveforms/Sound and waveforms.pdf` | 物体振动 → 空气压力变化 → 机械波 / 声波 → 波形携带频率、强弱、音色 → 周期与非周期 → 正弦的频率、振幅、相位 → 听觉范围 → 音高的对数关系 → MIDI、赫兹、音分 | **已修复：**已按 PPT 22 页重写并改名 `02-声音与波形-…`。补回 p2/p3/p4 的振动→空气→机械波，以及 p19 听觉范围；删掉自造的「三种结构」，改回 PPT 的周期/非周期两类 | 保留 `lesson02_pitch_and_hz.py` 的 MIDI / Hz 验证；前半补声波到波形的视觉链条 |
| 03 强弱、响度与音色 | `source_course/03 - Intensity, loudness, and timbre/Intensity, loudness, and timbre.pdf`；`intensity_and_timbre.ipynb` | 声功率 → 声强 → 听阈 / 痛阈 → 声强级与分贝 → 响度及等响曲线 → 音色 → 包络、泛音结构、调频 / 调幅 → 总结 | **已修复：**已按 PPT 32 页重写并改名 `03-强弱响度与音色-…`。删掉 PPT 里根本没有的平方反比；补回听阈/痛阈、等响曲线、ADSR、分音/基频/谐波/非谐性、揉弦与颤音 | 以同强弱、同音高、同长度但音色不同为验收问题；代码改为观察 `violin_c.wav`、`piano_c.wav`、`tremolo.wav`。频率内容画连续谱线，计算方法留到 10 以后 |
| 04 模拟声到数字录音 | `source_course/04 - Understanding audio signals/Understanding audio signals.pdf` | 音频信号 → 模拟与数字 → ADC 的采样和量化 → PCM → 采样周期与采样率 → 奈奎斯特与混叠 → 位深 → 存储成本 → 动态范围与量化噪声 → 录音 ADC → 播放 DAC | **已修复：**已按 PPT 48 页重写并改名 `04-模拟声到数字录音-…`。补回模拟 vs 数字、PCM、采样周期、动态范围、SQNR、ADC/DAC 两条链 | 用 `lesson04_sampling_and_bitdepth.py` 验证采样、混叠、量化和文件大小；正文必须先画完整的模拟→ADC→数字数据→DAC→声音路线 |
| 05 音频特征的分类 | `source_course/05 - Types of audio features for ML/Types of Audio Features for ML.pdf` | 为什么需要特征 → 五个分类维度：抽象层级、时间范围、音乐属性、信号域、机器学习方式 → 传统 ML 与深度学习 → DSP / 规则系统、传统 ML、深度学习三类系统 | **已修复：**已按 PPT 37 页重写并改名 `05-音频特征的分类-…`。补回原来出现 0 次的第三维「音乐属性」，以及 p31–p35 的三类智能音频系统 | `lesson05_feature_choices.py` 改为给三分类任务填写一张“五维特征选择表”；不在本课重新定义波形、频谱、声谱图 |
| 06 特征提取流水线 | `source_course/06 - How to extract audio features/How to extract audio features.pdf` | 回顾三种信号域 → 时域流水线：ADC、分帧、逐帧计算 → 为什么一帧要可感知且常用 2 的幂 → 频域流水线 → 频谱泄漏 → 加窗 → 非重叠帧的问题 → 重叠与帧移 → 完整频域流水线 | **已修复：**已按 PPT 63 页重写并改名 `06-特征提取流水线-…`。改回 PPT 的两条并列流水线；补回 p9/p11/p14 帧长依据、p25–p29 泄漏成因、以及 p40「加窗消掉两端 → 所以要重叠」这条逻辑链 | 保留 `lesson06_framing.py`，按 PPT 顺序先跑时域路线，再用不连续边界展示泄漏和加窗，最后比较非重叠 / 重叠帧；聚合只放脚本扩展 |
| 07 三个时域特征 | `source_course/07 - Time-domain audio features/Time-domain audio features.pdf` | 三个特征总览 → AE 定义、公式、逐帧计算、优缺点与应用 → RMS 定义、公式、优缺点与应用 → ZCR 定义、符号函数、公式与应用 | **已修复：**已按 PPT 50 页重写并改名 `07-三个时域特征-…`。三个特征各走「定义→公式逐项拆→优缺点→应用」；三段音乐的完整实现已移交 08/09 | `lesson07_three_time_features.py` 只用一个可手算的小帧依次验证三个公式，再用一小段真实声音说明三者回答的问题不同；完整音乐可视化留给 08 / 09 |
| 08 实现振幅包络 | `source_course/08 - Implementing the amplitude envelope/Implementing the amplitude envelope.ipynb` | 载入三段音乐 → 看文件基本信息 → 画三条时域波形 → 手写 AE → 计算三段音乐 → 把帧编号换成时间 → 波形与包络叠加比较 | **已修复：**已按 notebook 单元顺序重写并改名 `08-实现振幅包络-…`。主线在前，工程扩展在后。实测纠正两处原稿错误（见提交 b3774c7） | `lesson08_amplitude_envelope.py` 先严格复现 notebook 主线；绝对值、尾帧、居中和速度比较放“脚本额外”或短工程说明 |
| 09 实现 RMS 与 ZCR | `source_course/09 - RMS energy and zero-crossing rate/RMS Energy and Zero-Crossing Rate.ipynb` | 载入三段音乐 → 用 librosa 算 RMS → 与波形同图 → 从零实现 RMS 并对齐 → 用 librosa 算 ZCR → 三段音乐对比 → 语音与噪声对比 | **已修复：**已按 notebook 顺序重写并改名 `09-实现RMS与过零率-…`。补上原来完全没有的「手写与 librosa 对齐」，ZCR 比值实测 1.000978 = 1024/1023 | `lesson09_rms_zcr.py` 先按 notebook 顺序完成库函数、手写对齐、三种音乐、voice / noise；直流偏置、阈值与特征表放脚本扩展和项目出口 |
| 10 傅里叶变换直觉 | `source_course/10 - Fourier Transform The Intuition/Demystifying the Fourier Transform The Intuition.pdf`；`Fourier Transform.ipynb` | 把复杂声音拆成频率成分 → 从时间域到频率域 → 用不同频率的正弦去比较，每个频率得到强度和相位 → 选频率、调相位、量强度 → 重建、逆变换、加法合成 | 当前从“乘法不抵消”切入，局部解释清楚但源课的总目标、相位优化和重建路线不够突出；合成 440 / 880 取代了 notebook 的钢琴 C 主线 | `lesson10_fourier_intuition.py` 用简单双正弦建立直觉后，回到 `piano_c.wav` 复现 notebook；实验必须走完“试探→相位→强度→重建”而不是只找两个峰 |
| 11 复数 | `source_course/11 - Complex numbers.../Complex numbers for audio signal processing.pdf` | 为什么需要复数（傅里叶给的是强度＋相位，而强度是一个实数）→ 复数的来历 → 第一个复数、实部与虚部 → 画在平面上（直角坐标）→ 极坐标表示：模与角 → 欧拉公式 → 欧拉恒等式 → 极坐标 2.0 → 角度的几何含义（π/4、π、−π/2 各指哪儿） | 尚未按 PPT 重写 | `lesson11_complex.py`（待建）：用第 10 课那对正弦／余弦读数当实部虚部，画到复平面上，验证「模＝强度、角＝起点」，并核对欧拉公式两边相等 |
| 12 复数形式的傅里叶 | `source_course/12 - Defining the Fourier transform.../Defining the Fourier transform using complex numbers.pdf` | 回顾 → 直觉：把强度和相位当极坐标，编码进一个复数 → 复数傅里叶系数 → 连续信号的傅里叶变换 → 幅度谱 → 幅度与相位 → 逆变换 → 傅里叶表示：纯音加权、加相位、全部叠加 → 一次完整往返 | 尚未按 PPT 重写 | `lesson12_complex_ft.py`（待建）：把第 10 课的两支试探波合成一个复数系数，验证 |c| 和第 10 课的强度一致、arg(c) 和相位一致；再做一次完整往返，量重建误差 |
| 13 离散傅里叶变换 | `source_course/13 - Discrete Fourier Transform/Discrete Fourier Transform.pdf` | 数字化 → 数字信号 → 构造 DFT → 视觉解释 → **Hack 1 时间**：只在有限区间取值 x(0)…x(N−1) → **Hack 2 频率**：只算有限个频率，且 M = N（可逆、算得快）→ DFT 的冗余与奈奎斯特 → 从 DFT 到 FFT（N² 降到 N log₂N，靠正弦之间的冗余，N 是 2 的幂时最快） | 尚未按 PPT 重写 | `lesson13_dft.py`（待建）：手写 N=8 的 DFT 并和 np.fft.fft 对齐；量出 M=N 时可逆；验证后一半是前一半的镜像；实测 DFT 与 FFT 的耗时比 |
| 14 用 Python 取频谱 | `source_course/14 - Extracting the Discrete Fourier Transform/Visualising the Power Spectrum.ipynb` | 载入 violin_c4 / piano_c5 / sax / noise → `np.fft.fft` → 取绝对值得幅度 → 画幅度谱，用 `f_ratio` 只看低频那一段 → 四种声音的谱对比 | 尚未按 PPT 重写 | `lesson14_fft_spectrum.py`（待建）：严格复现 notebook 四段素材的谱；频率轴、单边谱、幅度归一化三件事作为工程说明补在主线之后 |
| 15 短时傅里叶变换 | `source_course/15 - Short-Time Fourier Transform.../Short-Time Fourier Transform explained easily.pdf` | 傅里叶变换的问题（时间没了）→ STFT 直觉 → 加窗 → STFT → 重叠帧 → 从 DFT 到 STFT → 输出：DFT 给一个向量，STFT 给一个矩阵（频率格数 × 帧数）→ 例子：10K 样本、帧长 1000、帧移 500 → 501 × 19 → 参数：帧长 → **时间与频率的取舍** → Hann 窗 → 可视化 → 声谱图 | 尚未按 PPT 重写 | `lesson15_stft.py`（待建）：先手算 501×19 再和 librosa.stft 对形状；扫帧长，量出「帧长越大频率越细、时间越糊」这条取舍的具体数字 |

## 跨课归属与允许的预告

| 内容 | 主场 | 其他课最多做到什么 |
| --- | --- | --- |
| 课程目标、应用、技术栈、学习路线 | 01 | 后文不再重复课程介绍，只说明与上一课的连接 |
| 声音产生、波形、频率、振幅、相位、音高 | 02 | 01 只在课程地图里列名称；后课可直接使用并链回 02 |
| 声功率、声强、分贝、响度、音色三组成 | 03 | 07 的 AE / RMS 只称“强弱的计算代理量”，不重新讲人耳响度 |
| ADC、PCM、采样、量化、采样率、位深、ADC / DAC | 04 | 实现课只引用统一参数，不重讲转换原理 |
| 特征分类体系和模型输入路线 | 05 | 后文只说明本课特征属于哪一类，不再重建五维分类表 |
| 分帧、帧长、帧移、加窗、泄漏、重叠 | 06 | 07—10 只引用统一参数；边界条件可在实现课补充，不重讲流水线 |
| AE、RMS、ZCR 的定义、公式、优缺点、应用 | 07 | 08 / 09 只用一句回顾后进入实现，不再次完成“定义→公式→用途”整套讲解 |
| AE 的代码实现和可视化 | 08 | 07 不放完整三音乐实现；09 不重复 AE |
| RMS / ZCR 的代码实现和比较 | 09 | 07 不做完整分类实验；后课直接读取结果 |
| 傅里叶变换的整体直觉、幅度、相位和可逆性 | 10 | 03 可以展示音色的连续谱线，但只说“稍后解释怎么算”；01 不提前讲频谱 / 声谱图 |
| 复数形式的傅里叶变换 | 11—12 | 10 只建立正弦试探直觉，不提前完整讲复数公式 |
| 声谱图的提取和轴 | 15—16 | 01 不讲；03 若展示仅作为音色观察图，不讲生成流程 |
| 复数、模与相位、欧拉公式 | 11 | 10 只说「要两支试探波」，不提复数；12 起直接使用 |
| 复数形式的傅里叶变换与可逆性 | 12 | 10 只做实数版的试探和重建；13 起当作已知 |
| DFT 的两个 Hack、冗余、FFT | 13 | 14 只调用 np.fft.fft，不重讲原理 |
| 用 np.fft 取谱、频率轴、单边谱 | 14 | 13 不写代码；16 起直接用 |
| STFT、声谱图的形状与参数取舍 | 15 | 06 只讲分帧和加窗，不提 STFT；16 讲怎么把它画对 |

## 文件级执行顺序

1. 先改 `课程总纲/README.md`、`课程项目/README.md` 和 `课程代码/README.md` 中错误的 01—10 路线；否则后续作者会继续按错误项目表写。
2. 完整重写 `B-教程式/01-*.md`；这是全组错位的源头。同步新建 `课程代码/lessons/lesson01_course_map.py`，确认新文章稳定后再处理旧 `lesson01_three_views.py`。
3. 按本表顺序重写 02—06，每完成一篇就对照下一篇，避免把后课内容当“补充知识”塞回来。
4. 再重写 07—10：07 负责定义，08 / 09 负责 notebook 实现，10 负责傅里叶整体直觉。
5. 正文结构确定后再改图。优先画 01 课程路线、02 声波到波形、04 ADC / DAC、05 五维分类、06 双流水线，以及 03 的连续频谱曲线。
6. 最后才补 mobile / card 版本、改正式稿文件名并迁移到 `零基础版_*`；当前阶段不要覆盖正式稿。

## 验收问题

- 只看各篇一级、二级标题，能否复述源 PPT 的推进顺序？
- 删除 FAQ、速查表和项目扩展后，正文骨架是否仍与源材料一致？
- 这一课有没有完整解释本应由后面课程负责的概念？
- 实现课是否按 notebook 单元格顺序完成一次原实验，再增加工程扩展？
- 图的横轴如果是时间或频率，是否使用连续曲线而不是柱状图？

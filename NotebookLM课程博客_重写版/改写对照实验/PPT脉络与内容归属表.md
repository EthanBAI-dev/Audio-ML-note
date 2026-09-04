# PPT 脉络与内容归属表（01—15）

> 版本：2026-09-03。本文是 01—10 重写的结构依据。先按源 PPT / notebook 确定“这一课为什么接在上一课后面”，再决定博客怎样讲得更容易懂。教程模板只能改善表达，不能改写课程顺序。

## 使用规则

1. **源 PPT / notebook 是课程骨架。** `原始素材大纲.md` 只负责快速检索；真正定顺序时必须直接看 PDF 的逐页演示和 notebook 的单元格顺序。
2. **博客可以补台阶，不能抢跑。** 为零基础读者补一句前置解释、一个小例子或一张图是允许的；提前完整讲授后续课程的概念不允许。
3. **每课只解决源材料提出的那组问题。** FAQ、速查表、工程注意和项目扩展都不是必选结构，不能为了套模板重复正文。
4. **实验沿着源材料走。** 概念课使用最小验证；实现课按 notebook 的读取、计算、画图、比较顺序展开。仓库脚本可以更全面，但正文先完成源实验。
5. **图跟着推理出现。** 时间和频率都是连续轴，使用曲线、波形或谱线，不用柱状图；柱状图只用于离散类别比较。

## 01—23 的课程主线

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
| 10 傅里叶变换直觉 | `source_course/10 - Fourier Transform The Intuition/Demystifying the Fourier Transform The Intuition.pdf`；`Fourier Transform.ipynb` | 把复杂声音拆成频率成分 → 从时间域到频率域 → 用不同频率的正弦去比较，每个频率得到强度和相位 → 选频率、调相位、量强度 → 重建、逆变换、加法合成 | **已修复：**按“试探频率 → 调相位 → 量强度 → 重建”重写，并回到真实钢琴录音 | `lesson10_fourier_intuition.py` 已用双正弦建立直觉，再用 `piano_c.wav` 完成源实验 |
| 11 复数 | `source_course/11 - Complex numbers.../Complex numbers for audio signal processing.pdf` | 为什么需要复数（傅里叶给的是强度＋相位，而强度是一个实数）→ 复数的来历 → 第一个复数、实部与虚部 → 画在平面上（直角坐标）→ 极坐标表示：模与角 → 欧拉公式 → 欧拉恒等式 → 极坐标 2.0 → 角度的几何含义（π/4、π、−π/2 各指哪儿） | **已修复：**已按 PPT 顺序重写，承接第 10 课的两支试探波 | `lesson11_complex.py` 已验证“模＝强度、角＝起点”和欧拉公式 |
| 12 复数形式的傅里叶 | `source_course/12 - Defining the Fourier transform.../Defining the Fourier transform using complex numbers.pdf` | 回顾 → 直觉：把强度和相位当极坐标，编码进一个复数 → 复数傅里叶系数 → 连续信号的傅里叶变换 → 幅度谱 → 幅度与相位 → 逆变换 → 傅里叶表示：纯音加权、加相位、全部叠加 → 一次完整往返 | **已修复：**已按 PPT 顺序重写，并用“保留相位 / 丢掉相位”的往返实验收束 | `lesson12_complex_ft.py` 已验证复数系数、幅度 / 相位与完整往返 |
| 13 离散傅里叶变换 | `source_course/13 - Discrete Fourier Transform/Discrete Fourier Transform.pdf` | 数字化 → 数字信号 → 构造 DFT → 视觉解释 → **Hack 1 时间**：只在有限区间取值 x(0)…x(N−1) → **Hack 2 频率**：只算有限个频率，且 M = N（可逆、算得快）→ DFT 的冗余与奈奎斯特 → 从 DFT 到 FFT（N² 降到 N log₂N，靠正弦之间的冗余，N 是 2 的幂时最快） | **已修复：**已按 PDF 的“数字化 → 两次收口 → 冗余 → FFT”顺序重写，并澄清现代 FFT 不限于 2 的幂长度 | `lesson13_dft.py` 已手写 N=8 DFT 并与 NumPy 对齐，验证逆变换、镜像和 DFT / FFT 耗时 |
| 14 用 Python 取频谱 | `source_course/14 - Extracting the Discrete Fourier Transform/Visualising the Power Spectrum.ipynb` | 载入 violin_c4 / piano_c5 / sax / noise → `np.fft.fft` → 取绝对值得幅度 → 画幅度谱，用 `f_ratio` 只看低频那一段 → 四种声音的谱对比 | **已修复：**已按 cell 0—13 原顺序重写；用 `rfftfreq` 修正源 Notebook 横轴，并澄清 `np.abs(X)` 是幅度谱而非功率谱；窗函数与 STFT 留给 15 | `lesson14_fft_spectrum.py` 已读取四段原始 WAV、统一 22050 Hz 单声道、验证 FFT / rFFT 长度，并输出四张 0—2205 Hz 相对 dB 曲线；公共计算进入 `soundlab/spectral.py` |
| 15 短时傅里叶变换 | `source_course/15 - Short-Time Fourier Transform.../Short-Time Fourier Transform explained easily.pdf` | 傅里叶变换的问题（时间没了）→ STFT 直觉 → 加窗 → STFT → 重叠帧 → 从 DFT 到 STFT → 输出：DFT 给一个向量，STFT 给一个矩阵（频率格数 × 帧数）→ 例子：10K 样本、帧长 1000、帧移 500 → 501 × 19 → 参数：帧长 → **时间与频率的取舍** → Hann 窗 → 可视化 → 声谱图 | **已修复：**已按 PDF 顺序重写。补边方式统一写死 `center=False`，「怎么把矩阵画成声谱图」整块留给 16 | `lesson15_stft.py` 已手算 501×19 并与 `librosa.stft(center=False)` 逐个复数比对（9519 个系数最大差 0.000e+00）；扫帧长量出时间与频率的取舍，扫帧移量出重叠与列数；公共 STFT 进入 `soundlab/spectral.py` |
| 16 用 Python 画声谱图 | `source_course/16 - Extracting Spectrograms from Audio with Python/Extracting Spectrograms from Audio with Python.ipynb` | 载入 scale / debussy / redhot / duke → 定 FRAME_SIZE 2048、HOP_SIZE 512 → `librosa.stft` → 看 shape 和元素类型（复数）→ `np.abs(S) ** 2` 得功率、再看 shape 和类型（实数）→ 画线性幅度声谱图 → `power_to_db` 画对数幅度声谱图 → `y_axis="log"` 画对数频率声谱图 → 三种风格的音乐各画一张 | **已修复：**已按 cell 1—26 的原顺序重写。对数频率轴的理由只用第 02 课的八度，人耳感知留给 17；`top_db=80` 这个默认截断在正文里点名 | `lesson16_spectrogram.py` 已验证 `(1025, 342)` 与 `center=False` 的 `(1025, 338)` 都对上算式，`abs(S) ** 2` 后 dtype 从 complex64 变 float32；量出线性上色时 99.70% 的格子低于峰值 1%、中间 60% 色阶只装 0.0445%，换 dB 后升到 11.34%；线性纵轴上 0—1000 Hz 占 9.07%，对数轴上占 61.98% |
| 17 梅尔声谱图 | `source_course/17 - Mel Spectrogram Explained Easily/Mel Spectrograms Explained Easily.pdf`；补充 `notebooklm博客/ダウンロード (17).md` | 上一课回顾 → 我们还有问题：人对频率的感知是对数的 → 心理声学实验 → 理想的音频特征（时频表示、感知上合理的幅度、感知上合理的频率）→ 梅尔刻度 → 刻度上等距＝听感上等距 → 提取配方：STFT → 幅度转 dB → 频率转梅尔刻度 → 选梅尔带数 → 造梅尔滤波器组 → 用它加权 | **已修复：**已按 p5—p40 的顺序重写。补充材料 `notebooklm博客/ダウンロード (17).md` 只用来补细节，其中「梅尔上等距＝听感上等距」这句实测对不上（梅尔 2.8 倍对音程 12 倍），正文写明了差距和原因 | `lesson17_mel_scale.py` 只用 NumPy 造滤波器组（librosa 只读音频、算 STFT）：两对音赫兹差 1.02 倍、音程差 12 倍、梅尔差 2.8 倍；0—8000 Hz 在梅尔上均分十段，切回赫兹最宽是最窄的 9.7 倍；五步造法的中间结果全部打印；滤波器组 (10, 1025)，第 1 个三角形底边 409 Hz、第 10 个 3198 Hz；M @ Y 把 1025 行压成 10 行、列数不变 |
| 18 用 Python 取梅尔声谱图 | `source_course/18 - Extracting Mel Spectrograms with Python/Extracting Mel Spectrograms with Python.ipynb` | 载入 scale → `librosa.filters.mel(n_fft, sr, n_mels=10)` → 看滤波器组的 shape 并画出来 → 改 n_mels 再画 → `librosa.feature.melspectrogram` → 看 shape → `power_to_db` → 画图 | **已修复：**已按 cell 1—15 重写，正题是源 Notebook 没做的那一步：把库和第 17 课手写的对齐 | `lesson18_mel_spectrogram.py` 逐个改默认值并每次重比：默认最大差 0.9999 → 加 `fmax=8000` 0.9995 → 加 `norm=None` 0.5080 → 加 `htk=True` 0.0147（顶点位置全一致）；残差来自第 17 课那一步四舍五入。列出 HTK 与 Slaney 在四个频率上的对照；验证 `melspectrogram` 等于「stft → abs()**2 → 滤波器组 @ 它」，最大差 0.000e+00；带数 10 / 90 对应 1/102.5 与 1/11.4 |
| 19 MFCC 是什么 | `source_course/19 - MFCCs Explained Easily/Mel-Frequency Cepstral Coefficients Explained Easily.pdf` | 上一课回顾 → 倒谱（cepstrum）→ 谱与倒谱、频率与倒频率（quefrency）→ 提升（liftering）→ 声音怎样产生：声门激励 × 声道传递函数 → 取对数把乘法变成加法 → 共振峰承载音色 → 用 DCT 把两者分开 → 为什么取前 12—13 个系数 → MFCC 的用途与优缺点 | 待写 | `lesson19_cepstrum.py`（待建）：造一个「快变的激励 × 慢变的包络」信号，量出取对数后两者变成相加、DCT 后落在倒频率轴的两端 |
| 20 用 Python 取 MFCC | `source_course/20 - Extracting MFCCs with Python/Extracting Mel-Frequency Cepstral Coefficients with Python.ipynb` | 载入 debussy → `librosa.feature.mfcc(n_mfcc=13)` → 看 shape → 画图 → `librosa.feature.delta` 求一阶差分 → `order=2` 求二阶 → 各自画图 → `np.concatenate` 拼成 39 行 | 待写 | `lesson20_mfcc.py`（待建）：验证 13 / 13 / 13 → 39 行，并说明 delta 是沿时间轴的差分；量出三种风格在前几个系数上的均值差 |
| 21 频域特征 | `source_course/21 - Frequency-Domain Audio Features/Frequency-domain audio features.pdf` | 上一课回顾 → 频域特征有哪些 → 提取流程（波形 → 分帧加窗 → 傅里叶变换 → 频谱 → 算特征）→ 数学约定 mt(n)、N → 频带能量比：低频段与高频段的能量之比，衡量低频有多主导 → 谱质心：频谱的「重心」，对应听感上的明亮度 → 带宽：围绕质心的展开程度 | 待写 | `lesson21_freq_features.py`（待建）：三个公式各手算一遍，用一个已知答案的合成谱验证质心落在预期位置；不碰真实音乐，留给 22 / 23 |
| 22 手写频带能量比 | `source_course/22 - Implementing Band Energy Ratio from Scratch with Python/Implementing Band Energy Ratio from scratch with Python.ipynb` | 载入 debussy / redhot / duke → FRAME_SIZE 2048、HOP_SIZE 512 → `librosa.stft` → 写 `calculate_split_frequency_bin` → 写 `band_energy_ratio` → 三段各算一次 → `frames_to_time` 换成秒 → 三条曲线画在一起 | 待写 | `lesson22_band_energy_ratio.py`（待建）：先验证分界格的算法（2000 Hz 落在第几格），再手写 BER 并与逐帧求和对齐；量出三种风格的中位数差多少 |
| 23 谱质心与带宽 | `source_course/23 - Spectral centroid and bandwidth/Frequency-domain audio features.ipynb` | 载入 debussy / redhot / duke → FRAME_SIZE 1024、HOP_LENGTH 512 → `librosa.feature.spectral_centroid` → 看 shape → `frames_to_time` → 三条质心曲线 → `librosa.feature.spectral_bandwidth` → 三条带宽曲线 | 待写 | `lesson23_centroid_bandwidth.py`（待建）：手写质心与带宽并与 librosa 对齐；把第 21 课的公式和这里的实测数接上，量出三种风格的差别 |

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
| librosa.stft 的调用、功率矩阵、dB 换算、对数频率轴 | 16 | 15 只手写原理和形状，不调绘图接口；17 起直接用「声谱图」这个词 |
| 人耳对频率的对数感知、梅尔刻度、梅尔滤波器组的道理 | 17 | 16 不提梅尔；18 只调库，不重讲刻度是怎么来的 |
| `librosa.filters.mel` / `melspectrogram` 的实现与形状 | 18 | 17 不写代码；19 起把梅尔声谱图当作已知输入 |
| 倒谱、倒频率、提升、DCT、为什么取 13 个系数 | 19 | 18 不提倒谱；20 只调库 |
| `librosa.feature.mfcc`、delta、拼成 39 维 | 20 | 19 不写代码；21 起把 MFCC 当作已有特征 |
| 频带能量比、谱质心、带宽的定义与公式 | 21 | 22 / 23 只用一句回顾后进入实现，不重讲定义 |
| 频带能量比的实现与三种风格对比 | 22 | 21 不写代码；23 不重复 BER |
| 谱质心与带宽的实现与三种风格对比 | 23 | 21 不写代码；22 不提前画质心曲线 |

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

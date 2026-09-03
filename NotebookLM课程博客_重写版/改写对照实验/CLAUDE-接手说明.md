# Claude 接手说明：按源课程重写 02—10

> 更新时间：2026-09-03。第 01 课已经完成首轮重写。下一步从第 02 课开始，按顺序推进到第 10 课。不要重新设计一套文章模板，也不要从旧文章标题反推课程内容。

## 一、开始工作前按顺序读取

1. 本文件：确认当前进度和不可回退的规则。
2. `.claude/skills/audio-course-lesson/SKILL.md`：Claude 的音频课程写作规则。
3. `NotebookLM课程博客_重写版/改写对照实验/PPT脉络与内容归属表.md`：01—10 的课程骨架和概念归属。
4. `NotebookLM课程博客_重写版/改写对照实验/章节任务卡/01-课程导论.md`：章节任务卡的完成示例。
5. 准备重写的那一课对应的源 PDF / notebook、当前 B 草稿和 lesson 脚本。

`NotebookLM课程博客_重写版/原始素材大纲.md` 只用于搜索关键词。文章顺序必须由源 PDF 的逐页顺序或 notebook 的单元格顺序决定。

## 二、当前已经完成什么

第 01 课已完成首轮重写：

- 正文：`NotebookLM课程博客_重写版/改写对照实验/B-教程式/01-课程导论-电脑要怎么分辨音乐类型.md`
- 章节任务卡：`NotebookLM课程博客_重写版/改写对照实验/章节任务卡/01-课程导论.md`
- 实验脚本：`NotebookLM课程博客_重写版/课程代码/lessons/lesson01_course_map.py`
- 新图：`NotebookLM课程博客_重写版/零基础版_01-05/figures/desktop/01-course-problem.svg`
- 总路线图生成器：`tools/build-course-roadmap.mjs`
- 课程位置图生成器：`tools/build-course-position-figures.mjs`

第 01 课正文标题已经改为“让电脑判断声音之前，为什么要先处理录音？”。文件名仍保留旧名，是为了暂时避免批量迁移链接，不代表文章仍要讲三种声音表示。

第 02 课只校准了开头承接句，其余正文仍是旧结构，必须完整重写。第 03—10 课也都还没有按新脉络完成重写。

第 01 课现有验收结果：

- 三段主素材实测都是 30.00 秒、22050 Hz、1 声道；
- 正文实验输出与 `lesson01_course_map.py` 一致；
- 可读性检查 `ERROR 0 / WARN 0`；
- 概念归属检查通过；
- 36 个 Markdown 文件的链接全部有效；
- 本轮两张手机版路线图检查 `ERROR 0 / WARN 0`；
- 三张桌面图已经目视检查。

旧脚本 `NotebookLM课程博客_重写版/课程代码/lessons/lesson01_three_views.py` 暂时保留。没有完成链接迁移前不要删除。

## 三、不可回退的写作规则

1. 源 PPT / notebook 决定教学顺序；博客只能补台阶，不能抢后面课程的主场。
2. 每课写正文前，先建立 `改写对照实验/章节任务卡/NN-*.md`，写清本课负责、只预告和明确延后的内容。
3. 环境准备只放 `课程总纲/README.md`。单篇文章只链接过去，不重复安装命令。
4. 实验必须有说明任务的二级大标题，例如“实验：比较三段声音的包络”，不能使用 “Hello World” 或“动手做”。
5. 删除固定套用的 FAQ、速查表、Level 1—4 和“核心概念一二三”。源材料需要什么结构就使用什么结构。
6. 概念课使用最小验证；实现课先完整复现 notebook，再把边界、性能和项目扩展放进脚本额外部分。
7. 正文代码、真实输出和 `课程代码/lessons/lessonNN_*.py` 必须一致；仓库脚本可以比正文更全面。
8. 时间和频率是连续变量，使用波形、连续曲线或谱线。柱状图只用于离散类别，不允许用频率柱状图代替连续频谱。
9. 当前阶段只完成 B 教程草稿和 desktop 图。正文稳定、用户确认后，才补 mobile / card、改文件名并迁移到正式稿。
10. 不覆盖 `零基础版_*/` 中的正式文章正文，不删除用户已有改动，不使用 `git reset --hard` 或 `git checkout --` 清理工作区。

## 四、第 02—10 课的精确输入文件

| 课 | 源材料 | 当前草稿 | 当前脚本 | 本课必须守住的主线 |
|---|---|---|---|---|
| 02 | `source_course/02 - Sound and waveforms/Sound and waveforms.pdf` | `B-教程式/02-声音与波形-振动怎样变成录音里那条线.md` | `课程代码/lessons/lesson02_pitch_and_hz.py` | 物体振动 → 空气压力变化 → 声波 → 波形 → 周期 / 正弦 → 听觉范围 → 音高的对数关系 |
| 03 | `source_course/03 - Intensity, loudness, and timbre/Intensity, loudness, and timbre.pdf`；同目录 `intensity_and_timbre.ipynb` | `B-教程式/03-强弱响度与音色-音量一样为什么听起来不同.md` | `课程代码/lessons/lesson03_loudness.py` | 声功率 → 声强 → 分贝 → 响度 → 音色 → 包络 / 泛音 / 调频 / 调幅 |
| 04 | `source_course/04 - Understanding audio signals/Understanding audio signals.pdf` | `B-教程式/04-模拟声到数字录音-连续的声音怎样变成一串数字.md` | `课程代码/lessons/lesson04_sampling_and_bitdepth.py` | 模拟信号 → ADC → 采样与量化 → PCM → 混叠 → 位深 → ADC / DAC 完整链 |
| 05 | `source_course/05 - Types of audio features for ML/Types of Audio Features for ML.pdf` | `B-教程式/05-音频特征的分类-该从录音里算出什么交给模型.md` | `课程代码/lessons/lesson05_feature_choices.py` | 按源课建立五个分类维度，不能继续写成“四个选择” |
| 06 | `source_course/06 - How to extract audio features/How to extract audio features.pdf` | `B-教程式/06-分帧加窗与聚合-怎样把整段录音变成可计算的小段.md` | `课程代码/lessons/lesson06_framing.py` | 时域流水线 → 频域流水线 → 泄漏 → 加窗 → 重叠和帧移；聚合不是正文主线 |
| 07 | `source_course/07 - Time-domain audio features/Time-domain audio features.pdf` | `B-教程式/07-振幅包络RMS与过零率-不用频谱能看出什么.md` | `课程代码/lessons/lesson07_three_time_features.py` | 只负责 AE、RMS、ZCR 的定义、公式、优缺点和应用，不抢 08 / 09 的完整实现 |
| 08 | `source_course/08 - Implementing the amplitude envelope/Implementing the amplitude envelope.ipynb` | `B-教程式/08-振幅包络怎么计算-从逐帧最大值到可靠时间轴.md` | `课程代码/lessons/lesson08_amplitude_envelope.py` | 严格按 notebook 完成三段音乐、波形、手写 AE、时间轴和叠加比较 |
| 09 | `source_course/09 - RMS energy and zero-crossing rate/RMS Energy and Zero-Crossing Rate.ipynb` | `B-教程式/09-RMS与过零率怎么计算-用整体强弱和翻越零线次数检查声音.md` | `课程代码/lessons/lesson09_rms_zcr.py` | librosa RMS → 波形叠加 → 手写对齐 → ZCR → 三段音乐 → voice / noise |
| 10 | `source_course/10 - Fourier Transform The Intuition/Demystifying the Fourier Transform The Intuition.pdf`；同目录 `Fourier Transform.ipynb` | `B-教程式/10-傅里叶变换的直觉-电脑怎样从复杂波形里找出频率.md` | `课程代码/lessons/lesson10_fourier_intuition.py` | 拆分频率 → 正弦试探 → 选择频率 → 调相位 → 量强度 → 重建和逆变换 |

表中的 `B-教程式/` 均指：

`NotebookLM课程博客_重写版/改写对照实验/B-教程式/`

## 五、每一课的固定执行顺序

1. 直接阅读源 PDF 的全部页面；有 notebook 时，再按单元格顺序完整读取。
2. 从源材料提取“这一页为什么接下一页”的推进链。
3. 对照 `PPT脉络与内容归属表.md` 和相邻两课，建立本课任务卡。
4. 先修改或重建 `lessonNN_*.py`，运行得到真实数字和输出。
5. 再重写 B 教程草稿；二级标题应该能够复述源材料顺序。
6. 根据教学命题决定配图。正文没稳定前只画 desktop，新图使用新文件名，避免覆盖正式稿正在引用的旧图。
7. 回读下一课开头，确保没有出现“上一课讲过”但上一课实际没有讲的错误承接。
8. 更新本文件和 `下一步待办.md` 的进度，写清下一个开发者要读取的精确文件。

## 六、每课完成后运行的检查

在仓库根目录执行，`<文章绝对路径>` 替换为当课 B 草稿：

```powershell
node .agents/skills/audio-course-lesson/scripts/check-readability.mjs "<文章绝对路径>"
node .agents/skills/audio-course-lesson/scripts/check-markdown-math.mjs "<文章绝对路径>"
node tools/check-concept-overlap.mjs --dir "NotebookLM课程博客_重写版/改写对照实验/B-教程式"
node tools/check-links.mjs
git diff --check
```

如果新增 mobile 图，再执行：

```powershell
node .agents/skills/audio-course-lesson/scripts/check-svg-mobile.mjs "<mobile SVG 或目录>"
```

自动检查通过不代表文章合格。最后仍要人工完成三件事：只看二级标题核对 PPT 顺序；核对正文数字与脚本输出；目视检查图片的轴、字号和含义。

## 七、Claude 下一步可以直接开始

从第 02 课开始：

1. 阅读 `source_course/02 - Sound and waveforms/Sound and waveforms.pdf` 全部页面。
2. 新建 `NotebookLM课程博客_重写版/改写对照实验/章节任务卡/02-声音与波形.md`。
3. 检查并修改 `NotebookLM课程博客_重写版/课程代码/lessons/lesson02_pitch_and_hz.py`。
4. 完整重写 `NotebookLM课程博客_重写版/改写对照实验/B-教程式/02-声音与波形-振动怎样变成录音里那条线.md`。
5. 重点补齐“物体振动怎样变成空气压力变化，再变成波形”这一段；不要从频率或频谱直接开讲。
6. 完成后回看第 03 课开头，只校准承接关系，不顺手重写第 03 课。


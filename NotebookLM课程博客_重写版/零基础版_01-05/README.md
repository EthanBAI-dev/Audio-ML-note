# 第 01～05 课：零基础知识主线改写版

本目录是第 01～05 课的最新改写。原稿和上一轮「改进版」均原样保留，没有覆盖。

| 版本 | 位置 | 定位 |
|---|---|---|
| 原稿 | `../01-…` 至 `../05-…` | 最初的课程笔记 |
| 改进版 | `../编辑总审_01-05/` | 修正事实与边界条件，但仍默认读者认识不少术语 |
| **本版** | 本目录 | 假设读者没有相关背景，由知识点主线组织场景、解释、公式与边界 |

## 文章

| 课 | 文章 | 知识主线 |
|---|---|---|
| 01 | [波形、频谱与声谱图：电脑识别声音时该“看”什么？](01-波形频谱与声谱图-电脑识别声音时该看什么.md) | 声音分类任务中，三种声音表示分别保留什么线索 |
| 02 | [波形、频率与音高：屏幕上的声音曲线记录了什么？](02-波形频率与音高-声音曲线记录了什么.md) | 从空气振动讲到周期、频率、相位与音高关系 |
| 03 | [分贝、响度与音色：为什么“音量一样”听起来仍不同？](03-分贝响度与音色-为什么音量一样听起来仍不同.md) | 声音传播、仪器读数与人的听感为什么不能混为一谈 |
| 04 | [采样率与位深：44.1 kHz 和 16 bit 决定了什么？](04-采样率与位深-44.1kHz和16bit决定了什么.md) | 数字音频中的采样、混叠、量化和精度取舍 |
| 05 | [音频特征怎么选？理解抽象层级、时间尺度与模型输入](05-音频特征怎么选-抽象层级时间尺度与模型输入.md) | 用四个问题把任务需要的证据变成合适的模型输入 |

## 这一版怎样写

- 每篇导读先给出核心知识链；二级标题直接标明知识点及其解决的问题。
- 开头用读者见过的场景建立问题，但场景只服务知识点，不代替章节骨架。
- 概念按需要逐个出现：先讲它是什么，再给专业名称，不设「术语对照」小节。
- 只看二级标题，也能复述文章依次讲了哪些概念；正文仍不显示「第一层 / 第二层 / 第三层」等写作脚手架。
- 公式、代码、单位与适用边界仍然保留，但顺着问题自然进入，不单独宣布“现在进入专业部分”。
- 正文只保留简短小结，不附术语表和「课程来源与复现材料」。

## 配图

每篇 4 张，共 20 张，位于 `figures/`。每张同时有电脑版和手机版，由同一份数据、同一段代码生成：

| | 目录 | 画布 | 排布 |
|---|---|---|---|
| 电脑版 | `figures/desktop/` | 880 px | 并排横排 |
| 手机版 | `figures/mobile/` | 420 px | 竖向单列，360 px 正文宽度下最小字号约 12 px |

正文用 `<picture>` 按屏幕宽度切换，GitHub 的 Markdown 渲染支持这个标签。

**波形、频谱、声谱图全部来自真实计算**，不再用色块摆出"看起来像"的图：

- 素材优先取 `source_course/audio_resources/` 里的课程音频（piano_c、violin_c、scale、voice 等），其次是与正文例子严格对应的合成信号；
- 声谱图按 magma 色标渲染成 PNG 再嵌进 SVG，坐标轴和中文标注仍是真实 `<text>`，所以手机上不糊，单张仍在几十 KB；
- magma 是 librosa 与音频论文里画声谱图的常用色标，感知均匀、色觉障碍下可读；线图与卡片用蓝 `#0878b9` / 暖 `#c65a3d` / 绿 `#3b8f68`，已通过色觉障碍与对比度校验。

生成与验收：

```bash
node tools/build-figures.mjs
node tools/build-figure-contact-sheets.mjs
node ".claude/skills/audit-and-rewrite-popular-science/scripts/check-svg-mobile.mjs"   "NotebookLM课程博客_重写版/零基础版_01-05/figures/mobile"
```

## 写作规则与检查

Claude Code 可直接读取项目内的 skill：

```text
.claude/skills/audit-and-rewrite-popular-science/
├─ SKILL.md
├─ references/article-shape.md
├─ references/data-figures.md
├─ references/mobile-figures.md
├─ references/zero-basis-rules.md
├─ references/rubric.md
├─ scripts/check-readability.mjs
└─ scripts/check-svg-mobile.mjs
```

检查这 5 篇：

```bash
node ".claude/skills/audit-and-rewrite-popular-science/scripts/check-readability.mjs" \
  "NotebookLM课程博客_重写版/零基础版_01-05/01-波形频谱与声谱图-电脑识别声音时该看什么.md" \
  "NotebookLM课程博客_重写版/零基础版_01-05/02-波形频率与音高-声音曲线记录了什么.md" \
  "NotebookLM课程博客_重写版/零基础版_01-05/03-分贝响度与音色-为什么音量一样听起来仍不同.md" \
  "NotebookLM课程博客_重写版/零基础版_01-05/04-采样率与位深-44.1kHz和16bit决定了什么.md" \
  "NotebookLM课程博客_重写版/零基础版_01-05/05-音频特征怎么选-抽象层级时间尺度与模型输入.md"
```

检查 Markdown 公式：

```bash
node ".claude/skills/audit-and-rewrite-popular-science/scripts/check-markdown-math.mjs" \
  "NotebookLM课程博客_重写版/零基础版_01-05"
```

验收线：文章、公式与图片检查的 ERROR 必须为 0；WARN 必须修复，或在审计记录中说明保留理由。

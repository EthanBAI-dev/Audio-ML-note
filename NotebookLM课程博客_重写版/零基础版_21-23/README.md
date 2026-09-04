# 第 21～23 课：零基础知识主线改写版

本组属于[课程总纲](../课程总纲/README.md)的第 21-23 阶段：**用少量数字概括频谱**。

每篇末尾的「动手做」对应[课程项目《三首曲子，一个分类器》](../课程项目/README.md)的概括与验证（第 21—23 步）。

本目录完成课程最后三篇的重写。上一级目录中的旧稿继续保留，没有覆盖。

完整方法见[《零基础科普文章改写与配图工作流》](../零基础改写与配图工作流.md)。本批继续使用自然递进的正文结构，不在文章中显示“基础层、进阶层”等编辑脚手架。

## 文章与边界

| 课 | 文章 | 本篇只解决什么 |
|---|---|---|
| 21 | [频域特征怎样概括一帧声音：带能量比、频谱质心与带宽](21-频域音频特征-一列频谱怎样压成三个数.md) | 从比例、中心和扩散三个问题建立概念框架，不提前展开完整代码 |
| 22 | [用 Python 实现带能量比（BER）：怎样正确切分频率箱？](22-用Python实现带能量比-2000Hz到底该切在哪一格.md) | 用真实频率轴切分频率箱，沿正确矩阵轴逐帧计算稳定的 BER |
| 23 | [频谱质心与带宽：怎样量出声音频率的中心与扩散？](23-频谱质心与带宽-怎样量出中心和展开.md) | 推导质心和带宽，固定幅度加权口径，并说明静音与录音条件的影响 |

第 21 篇先让读者知道三个数字各自在回答什么，第 22、23 篇再分别进入实现。BER 使用功率；质心和带宽按本文的 Librosa 示例使用幅度。两种权重不混写。

## 配图

共 12 张知识图，每张输出桌面和手机两个版式：

- `figures/desktop/`：880 px，保留横向比较。
- `figures/mobile/`：420 px，改为纵向阅读，保留曲线、刻度和说明。

声谱图与三段音乐的特征轨迹来自课程音频的真实计算。概念频谱由写明峰值位置与宽度的确定性信号生成，不用装饰性形状假扮数据。生成命令：

```bash
npm install --prefix tools
npm run --prefix tools figures:21-23
npm run --prefix tools contact:21-23
```

## 验收命令

```bash
node ".agents/skills/audio-course-lesson/scripts/check-readability.mjs" \
  "NotebookLM课程博客_重写版/零基础版_21-23/21-频域音频特征-一列频谱怎样压成三个数.md" \
  "NotebookLM课程博客_重写版/零基础版_21-23/22-用Python实现带能量比-2000Hz到底该切在哪一格.md" \
  "NotebookLM课程博客_重写版/零基础版_21-23/23-频谱质心与带宽-怎样量出中心和展开.md"

node ".agents/skills/audio-course-lesson/scripts/check-markdown-math.mjs" \
  "NotebookLM课程博客_重写版/零基础版_21-23"

node ".agents/skills/audio-course-lesson/scripts/check-svg-mobile.mjs" \
  "NotebookLM课程博客_重写版/零基础版_21-23/figures/mobile"
```

Claude Code 可以使用 `.claude/skills/` 下的同名 skill 与脚本；两份规则保持同步。

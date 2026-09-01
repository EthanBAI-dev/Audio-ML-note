# 课程动画（Manim）

静态配图仍然是主干。动画只加在少数几课上——那几课的图里有一个**连续变化的量**，
读者不看着它变就是不懂。其余的课，静态图更好：能放大、能进小红书卡片、能写 alt、
加载不花钱。

## 环境

已经装好，不用再折腾：

| 组件 | 版本 | 装法 |
| --- | --- | --- |
| Python | 3.12.10 | 之前为 numpy/librosa 装的 |
| manim（社区版） | 0.21.0 | `pip install manim` |
| ffmpeg | 9.0.1 | `winget install Gyan.FFmpeg --scope user` |

两个坑：

- **ffmpeg 不在当前进程的 PATH 里**。winget 把路径写进了注册表，已开的 shell 读不到。
  `render.ps1` 里显式前置了那个目录，所以用脚本渲染就没事；直接敲 `manim` 会报找不到 ffmpeg。
- **没有装 LaTeX**，所以 `MathTex` / `Tex` 全都用不了。场景里的文字一律用 `Text`，
  走 Pango，中文字体是 Microsoft YaHei。要排真正的数学公式才需要再装 MiKTeX。

## 渲染

```powershell
.\render.ps1 Aliasing              # 480p15，改稿时用，几十秒
.\render.ps1 Aliasing -q h         # 1080p60，交付用
.\render.ps1 Aliasing -q h -gif    # 直接出 GIF
```

给 Markdown 内嵌的 GIF 不要用 manim 自己导，体积压不下来。先出 480p15 的 mp4，
再用调色板压：

```bash
ffmpeg -y -i FourierWinding.mp4 -vf "fps=12,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 FourierWinding.gif
```

三条现成的 GIF 分别是 2.9 MB / 1.2 MB / 0.7 MB，GitHub 单文件 10 MB 以内，够用。

## 配色

`scenes.py` 顶上的常量和正文 SVG 配图逐字一致（`tools/lib/figure.mjs` 的 `PALETTE`），
声谱图也用同一张 magma。动画是同一套图的会动版本，不是另一种视觉风格。

## 已做的三个

| 场景 | 课 | 讲什么 |
| --- | --- | --- |
| `FourierWinding` | 10 傅里叶变换的直觉 | 试探频率连续扫过，绕圈图的重心跟着跑；对上 3 Hz 和 5 Hz 时重心甩出去 |
| `Aliasing` | 04 采样率与位深 | 采样率一档档降下来，9 Hz 塌成 5 Hz、3 Hz、1 Hz，而且回不来 |
| `StftBuild` | 15 短时傅里叶变换 | 窗滑过波形，声谱图一列一列长出来（用的是 `scale.wav` 真实录音） |

## 还值得做的

按「动画能不能替掉一段解释」排：

1. **11 复数的模与相位** —— 旋转向量和它在实轴上的投影同时画。正弦是转圈的影子，
   这件事一动就懂，写多少字都不如看一眼。
2. **06 分帧、加窗** —— 帧长、帧移两个滑杆，看帧数怎么变。可以和 `StftBuild` 合成一条。
3. **12 傅里叶为何用复数** —— 单探针会漏看（相位不对就抵消掉），复数探针不会。
   是第 10 课那条的续集。
4. **17 梅尔滤波器组** —— 513 根竖线塌成 64 个数，三角窗一个个扫过去。
5. **20 MFCC 动态特征** —— 差分窗在时间轴上滑。

## 不建议做的

- **08、09、18、22 这些「实现」课**：内容是代码和边界处理，动画帮不上忙。
- **03 分贝、05 选特征、21 三类统计**：是分类和对照，读者需要停下来比，动画反而催着走。
- **课程位置图、路线图**：同理，那是要停下来读的东西。

## 两条硬限制

- 小红书图文笔记只吃静态图，动画进不去。要么发视频笔记，要么从动画里抽关键帧
  另做静态图——所以动画永远不能是唯一的那份图。
- 动画没有 alt 文本。正文里每条动画旁边都得有一句话把结论写出来，
  不能让结论只存在于画面里。

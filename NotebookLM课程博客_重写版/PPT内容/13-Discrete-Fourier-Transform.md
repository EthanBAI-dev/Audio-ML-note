# 第 13 课 · Discrete Fourier Transform

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Discrete Fourier Transform.pdf

共 15 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Discrete Fourier Transform

### p2

Join the community!
thesoundofai.slack.com

### p3

Previously...

### p5

Digitalization

### p9

Digital signal

### p11

Building a discrete Fourier transform

### p16

DFT: Visual interpretation

### p18

Building a discrete Fourier transform

### p19

Hack 1: Time
Consider f to be non 0 in a finite time interval
x(0), x(1), …, x(N-1)

### p22

Hack 2: Frequency
Compute transform for finite # of frequencies
# frequencies (M) = # samples (N)
Why M = N?
Invertible transformation
Computational efficient

### p23

Hacking our way around...

### p33

Redundancy in DFT

### p37

Redundancy in DFT
Nyquist Frequency

### p38

From DFT to Fast Fourier Transform
DFT is computationally expensive (N2)
FFT is more efficient (Nlog2N)
FFT exploits redundancies across sinusoids
FFT works when N is a power of 2

### p39

What’s up next?
Play around with FFT

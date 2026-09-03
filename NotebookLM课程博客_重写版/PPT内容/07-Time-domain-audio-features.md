# 第 07 课 · Time-domain audio features

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Time-domain audio features.pdf

共 22 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Time-domain audio features

### p2

Join the community!
thesoundofai.slack.com

### p3

Time-domain features
Amplitude envelope (AE)
Root-mean-square energy (RMS)
Zero-crossing rate (ZCR)

### p4

Amplitude envelope
Max amplitude value of all samples in a frame

### p6

Amplitude envelope
Max amplitude value of all samples in a frame
Amplitude envelope
at frame t

### p7

Amplitude envelope
Max amplitude value of all samples in a frame
Amplitude of
kth sample
Amplitude envelope
at frame t

### p8

Amplitude envelope
Max amplitude value of all samples in a frame
Amplitude of
kth sample
Frame size
Amplitude envelope
at frame t

### p9

Amplitude envelope
Max amplitude value of all samples in a frame
Amplitude of
kth sample
First sample of frame t
Amplitude envelope
at frame t

### p10

Amplitude envelope
Max amplitude value of all samples in a frame
Amplitude of
kth sample
First sample of frame t
Last sample of frame t
Amplitude envelope
at frame t

### p11

Amplitude envelope
Max amplitude value of all samples in a frame
Calculate AE for all the frames

### p12

Amplitude envelope

### p27

Amplitude envelope
Max amplitude value of all samples in a frame
Gives rough idea of loudness
Sensitive to outliers
Onset detection, music genre classification

### p28

Root-mean-square energy
RMS of all samples in a frame

### p30

Root-mean-square energy
RMS of all samples in a frame
Energy of kth
sample

### p31

Root-mean-square energy
RMS of all samples in a frame
Sum of energy for all
samples in frame t

### p32

Root-mean-square energy
RMS of all samples in a frame
Mean of sum of energy

### p35

Root-mean-square energy
RMS of all samples in a frame
Indicator of loudness
Less sensitive to outliers than AE
Audio segmentation, music genre classification

### p36

Zero crossing rate
Number of times a signal crosses the horizontal axis

### p40

Zero crossing rate
Number of times a signal crosses the horizontal axis
Sign function:
s(k) > 0 → +1
s(k) < 0 → -1
s(k) = 0 → 0

### p41

Zero crossing rate
Number of times a signal crosses the horizontal axis

### p49

Zero crossing rate applications
Recognition of percussive vs pitched sounds
Monophonic pitch estimation
Voice/unvoiced decision for speech signals

### p50

What’s up next?
Implement amplitude envelope
Visualise amplitude envelope for different music genres

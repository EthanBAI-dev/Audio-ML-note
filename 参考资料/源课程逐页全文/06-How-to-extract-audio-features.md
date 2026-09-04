# 第 06 课 · How to extract audio features

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## How to extract audio features.pdf

共 29 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
How do we extract audio features?

### p2

Join the community!
thesoundofai.slack.com

### p3

Previously on Audio Processing for ML
Time-domain features
Frequency-domain features
Time-frequency domain features

### p5

Time-domain feature pipeline
ADC

### p6

Time-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
framing

### p9

Frames
Perceivable audio chunk
1 sample @44.1KHz = 0.0227ms
Duration 1 sample << Ear’s time resolution (10ms)

### p11

Frames
Perceivable audio chunk
Power of 2 num. samples
Typical values: 256 - 8192

### p14

Frames
Perceivable audio chunk
Power of 2 num. samples
Typical values: 256 - 8192
= 11.6ms

### p15

Time-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
framing

### p18

Time-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
feature computation
aggregation
(mean, median, GMM)
feature value/vector/matrix

### p20

Frequency-domain feature pipeline
ADC

### p21

Frequency-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
framing

### p22

From time to frequency domain

### p25

Spectral leakage
Processed signal isn’t an integer number of periods
Endpoints are discontinuous

### p27

Spectral leakage
Processed signal isn’t an integer number of periods
Endpoints are discontinuous
Discontinuities appear as high-frequency components not present in the
original signal

### p29

Spectral leakage
FT

### p30

Frequency-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
windowing

### p33

Windowing
Apply windowing function to each frame
Eliminates samples at both ends of a frame
Generates a periodic signal

### p34

Hann window

### p35

Windowing

### p40

Houston we have another problem!

### p43

Non-overlapping frames

### p49

Overlapping frames

### p56

Overlapping frames
frame size K

### p57

Overlapping frames
hop length

### p59

Frequency-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
windowing
FT

### p61

Frequency-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
windowing
feature
computation
aggregation
(mean, median, GMM)

### p62

Frequency-domain feature pipeline
frame 1: sample 1 … 128
frame 2: sample 64 … 192
frame 3: sample 128 … 256
frame 4: sample 192 … 320
windowing
feature
computation
feature
value/vector/matrix
aggregation
(mean, median, GMM)

### p63

What’s up next?
Time-domain features

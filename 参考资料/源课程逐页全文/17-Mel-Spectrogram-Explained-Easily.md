# 第 17 课 · Mel Spectrogram Explained Easily

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Mel Spectrograms Explained Easily.pdf

共 23 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Mel-spectrograms Explained Easily

### p2

Previously...

### p5

Psychoacoustic experiment
1st sample: C2 - C4 -> (65 - 262Hz)
2nd sample: G6 - A6 -> (1568 - 1760Hz)
200 Hz

### p6

We have a problem!
Humans perceive frequency
logarithmically

### p10

Ideal audio feature
Time-frequency representation
Perceptually-relevant amplitude representation
Perceptually-relevant frequency representation
Mel spectrograms

### p11

Mel-scale
Logarithmic scale
Equal distances on the scale have same
“perceptual” distance
1000 Hz = 1000 Mel

### p12

Mel-scale

### p14

Recipe to extract Mel spectrogram
Extract STFT
Convert amplitude to DBs
Convert frequencies to Mel scale

### p16

Convert frequencies to Mel scale
Choose number of mel bands
Construct mel filter banks
Apply mel filter banks to spectrogram

### p17

How many mel bands?

### p22

How many mel bands?
It depends on the problem!

### p23

Convert frequencies to Mel scale
Choose number of mel bands
Construct mel filter banks
Apply mel filter banks to spectrogram

### p25

Mel filter banks
Convert lowest / highest frequency to Mel
Create # bands equally spaced points

### p29

Mel filter banks
Convert lowest / highest frequency to Mel
Create # bands equally spaced points
Convert points back to Hertz
Round to nearest frequency bin
Create triangular filters

### p30

Mel filter banks

### p31

Mel filter banks’ shape
(# bands, framesize / 2 + 1)

### p32

Convert frequencies to Mel scale
Choose number of mel bands
Construct mel filter banks
Apply mel filter banks to spectrogram

### p34

Applying mel filter banks to spectrogram
M = (# bands, framesize / 2 + 1)
Y = (framesize / 2 + 1, # frames)

### p37

Applying mel filter banks to spectrogram
Mel spectrogram = MY
(# bands, # frames)

### p38

Applying mel filter banks to spectrogram

### p39

Mel spectrogram applications
Audio classification
Automatic mood recognition
Music genre classification
Music instrument classification

### p40

What’s up next?
Extract Mel spectrograms with Python and Librosa
Visualise Mel spectrograms
Extract and visualise Mel filter banks

### p41

Join the community!
thesoundofai.slack.com

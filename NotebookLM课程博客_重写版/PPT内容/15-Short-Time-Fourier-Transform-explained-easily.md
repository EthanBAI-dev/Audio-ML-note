# 第 15 课 · Short-Time Fourier Transform explained easily

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Short-Time Fourier Transform Explained Easily.pdf

共 34 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Short-Time Fourier Transform
Explained Easily

### p2

Join the community!
thesoundofai.slack.com

### p4

Previously...
DFT

### p5

Fourier Transform Problem
WE KNOW WHAT
WE DON’T KNOW WHEN

### p7

STFT intuition

### p12

Windowing
Apply windowing function to signal

### p14

Windowing

### p16

Windowing
window size

### p17

Windowing
window size = frame size

### p18

Windowing
window size ≠ frame size

### p19

STFT

### p23

Overlapping frames
hop size (H)

### p24

From DFT to STFT

### p28

From DFT to STFT
m = 1

### p29

From DFT to STFT
m = 2

### p30

From DFT to STFT
m = 3

### p31

From DFT to STFT

### p34

From DFT to STFT
Starting sample of
current frame

### p37

From DFT to STFT

### p41

Outputs
DFT
Spectral vector (# frequency bins)
N complex Fourier coefficients
STFT
Spectral matrix (# frequency bins, # frames)
Complex Fourier coefficients

### p42

Outputs
# frequency bins =

### p43

Outputs
# frames =
# frequency bins =

### p45

Example STFT output
Signal = 10K samples
Frame size = 1000
Hop size = 500
# frequency bins = 1000 / 2 + 1 = 501

### p47

Example STFT output
Signal = 10K samples
Frame size = 1000
Hop size = 500
# frequency bins = 1000 / 2 + 1 = 501 -> (0, sampling rate/2)
# frames = (10000 - 1000) / 500 + 1 = 19

### p48

Example STFT output
Signal = 10K samples
Frame size = 1000
Hop size = 500
STFT -> (501, 19)

### p49

STFT parameters
Frame size

### p52

Time / frequency trade off
frame size
freq resolution
time resolution

### p55

STFT parameters
Frame size
Hop size

### p57

STFT parameters
Frame size
Hop size
½ K, ¼ K, ⅛ K

### p58

STFT parameters
Frame size
Hop size
Windowing function

### p59

Hann window

### p64

Visualising sound

### p66

Spectrogram

### p67

What’s up next?
Extract spectrograms with Librosa
Discuss different flavours of spectrograms
Examine different audio data

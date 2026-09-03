# 第 21 课 · Frequency-Domain Audio Features

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Frequency-domain audio features.pdf

共 28 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Frequency-domain audio features

### p2

Join the community!
thesoundofai.slack.com

### p3

Previously...
Mel-Frequency Cepstral Coefficients

### p4

Frequency-domain features
Band energy ratio (BER)
Spectral centroid (SC)
Bandwidth (BW)

### p5

Extracting frequency-domain features

### p8

Extracting frequency-domain features
STFT
FEATURE
COMPUTATION

### p10

Math conventions
mt(n) -> Magnitude of signal at frequency bin n and frame t
N -> # frequency bins

### p11

Band energy ratio
Comparison of energy in the lower/higher frequency bands
Measure of how dominant low frequencies are

### p14

Band energy ratio
Power at t, n
Split frequency

### p15

Band energy ratio

### p17

Band energy ratio
LOWER FREQUENCIES
HIGHER FREQUENCIES

### p20

Band energy ratio
Power in the lower frequency bands

### p21

Band energy ratio
Power in the higher frequency bands
Power in the lower frequency bands

### p22

Band energy ratio

### p26

Band energy ratio applications
Music / speech discrimination
Music classification (e.g., music genre classification)

### p27

Spectral centroid
Centre of gravity of magnitude spectrum
Frequency band where most of the energy is concentrated
Measure of “brightness” of sound

### p28

Spectral centroid
Weighted mean of the frequencies

### p30

Spectral centroid
Weighted mean of the frequencies
Frequency bin

### p31

Spectral centroid
Weighted mean of the frequencies
Weight for n

### p32

Spectral centroid
Weighted mean of the frequencies
Sum of weights

### p33

Spectral centroid applications
Audio classification
Music classification

### p34

Bandwidth
Derived from spectral centroid
Spectral range around the centroid
Variance from the spectral centroid
Describe perceived timbre

### p35

Bandwidth
Weighted mean of the distances of frequency bands from SC

### p37

Bandwidth
Weighted mean of the distances of frequency bands from SC
Weight for n

### p39

Bandwidth
Weighted mean of the distances of frequency bands from SC
Distance of frequency band from
spectral centroid
Weight for n
Sum of weights

### p41

Bandwidth
Energy spread across
frequency bands
BWt

### p45

Bandwidth applications
Music processing (e.g., music genre classification)

### p46

What’s up next?
Implement band energy ratio in Python (almost!) from scratch
Visualise BER for music in different genres

# 第 19 课 · MFCCs Explained Easily

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Mel-Frequency Cepstral Coefficients Explained Easily.pdf

共 37 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Mel-Frequency Cepstral Coefficients
Explained Easily

### p2

Join the community!
thesoundofai.slack.com

### p3

Previously...

### p4

Mel-Frequency Cepstral Coefficients

### p8

Cepstrum

### p10

Cepstrum
Spectrum

### p12

Cepstrum
Spectrum
Quefrency
Liftering
Rhamonic

### p13

Cepstrum
Spectrum
Quefrency
Frequency
Liftering
Filtering
Rhamonic
Harmonic

### p14

An historical note on Cepstrum
Developed while studying echoes in seismic signals (1960s)
Audio feature of choice for speech recognition / identification (1970s)
Music processing (2000s)

### p19

Computing the cepstrum
Time-domain
signal
Spectrum
Log spectrum
Cepstrum

### p22

Visualising the cepstrum
Signal
Power spectrum
DFT

### p23

Visualising the cepstrum
Power spectrum

### p24

Visualising the cepstrum
Log power spectrum
Power spectrum
log

### p26

Visualising the cepstrum
Log power spectrum
IDFT
Cepstrum

### p29

Visualising the cepstrum
Log power spectrum
IDFT
Cepstrum
1st rhamonic

### p31

The vocal tract
Vocal tract acts as a filter

### p32

Speech generation

### p34

Understanding the cepstrum
dB
Hz
Log-spectrum
Speech
Spectral envelope

### p36

Understanding the cepstrum
dB
Hz
Log-spectrum
Speech
Spectral envelope
Formants = Carry identity of sound

### p37

Understanding the cepstrum
dB
Hz
Log-spectrum
Speech
Spectral envelope
Vocal tract frequency
response

### p40

Understanding the cepstrum
dB
Hz
Log-spectrum
Speech
Spectral envelope
Vocal tract frequency
response
Spectral detail
Glottal pulse

### p41

Speech
Convolution of vocal tract
frequency response with
glottal pulse

### p42

Formalising speech

### p48

Formalising speech
Hz
Speech
Vocal tract frequency
response
Glottal pulse

### p49

The goal: Separating components

### p53

Separating components
Hz
quefrency
IDFT
4 Hz

### p54

Separating components
Hz
quefrency
IDFT
100 Hz

### p55

Separating components
Hz
quefrency
IDFT

### p62

Computing Mel-Frequency Cepstral Coefficients
Waveform
DFT
Log-Amplitude
Spectrum
Mel-Scaling
Discrete
Cosine
Transform
MFCCs

### p65

Why Discrete Cosine Transform?
Simplified version of Fourier Transform
Get real-valued coefficient

### p68

Why Discrete Cosine Transform?
Simplified version of Fourier Transform
Get real-valued coefficient
Decorrelate energy in different mel bands
Reduce # dimensions to represent spectrum

### p69

How many coefficients?
Traditionally: first 12 - 13 coefficients
First coefficients keep most information (e.g., formants, spectral envelope)
Use Δ and ΔΔ MFCCs
Total 39 coefficients per frame

### p71

Visualising MFCCs
# coefficients
# frames

### p72

MFCCs advantages
Describe the “large” structures of the spectrum
Ignore fine spectral structures
Work well in speech and music processing

### p73

MFCCs disadvantages
Not robust to noise
Extensive knowledge engineering
Not efficient for synthesis

### p74

MFCCs applications
Speech processing
Speech recognition
Speaker recognition
Music processing
Music genre classification
Mood classification
Automatic tagging

### p75

What’s up next?
Extract MFCCs with Python and Librosa
Visualise MFCCs

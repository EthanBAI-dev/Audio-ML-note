# 第 10 课 · Fourier Transform The Intuition

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Demystifying the Fourier Transform The Intuition.pdf

共 18 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Demystifying the Fourier Transform:
The Intuition

### p2

Join the community!
thesoundofai.slack.com

### p4

Intuition
Decompose a complex sound into its frequency components

### p6

From time to frequency domain
FT

### p10

Deeper intuition
Compare signal with sinusoids of various frequencies
For each frequency we get a magnitude and a phase
High magnitude indicates high similarity between the signal
and a sinusoid

### p11

Sine wave

### p12

Deeper intuition
Compare signal with sinusoids of various frequencies
For each frequency we get a magnitude and a phase
High magnitude indicates high similarity between the signal
and a sinusoid

### p15

Fourier transform: Step by step
Choose a frequency
Optimise phase
Calculate magnitude

### p18

Fourier transform
Multiply signal and sinusoid

### p19

Fourier transform
Calculate area

### p20

Fourier transform
Select phase in [0, 1) that
maximises the area

### p22

Fourier transform
Select max area

### p23

Fourier transform
t ∈ R

### p24

Fourier transform
f ∈ R

### p29

Reconstructing a signal
Superimpose sinusoids
Weight them by the relative magnitude
Use relative phase
Original signal and FT have same information

### p31

Inverse Fourier transform
IFT

### p33

Additive synthesis

### p34

What’s up next?
Complex numbers

## Fourier Transform.ipynb

### cell 1（code）

```python
import os
import librosa
import scipy as sp
import IPython.display as ipd
import matplotlib.pyplot as plt
import numpy as np
```

### cell 2（code）

```python
# load audio file in the player
BASE_FOLDER = "../audio_resources/"
audio_path = os.path.join(BASE_FOLDER, "piano_c.wav")
ipd.Audio(audio_path)
```

### cell 3（code）

```python
# load audio file
signal, sr = librosa.load(audio_path)
```

### cell 4（code）

```python
# plot waveform
plt.figure(figsize=(18, 8))
librosa.display.waveshow(signal, sr=sr, alpha=0.5)
plt.show()
```

### cell 5（code）

```python
# derive spectrum using FT
ft = sp.fft.fft(signal)
magnitude = np.absolute(ft)
frequency = np.linspace(0, sr, len(magnitude))
```

### cell 6（code）

```python
# plot spectrum
plt.figure(figsize=(18, 8))
plt.plot(frequency[:5000], magnitude[:5000]) # magnitude spectrum
plt.xlabel("Frequency (Hz)")
plt.ylabel("Magnitude")
plt.show()
```

### cell 7（code）

```python
len(signal)
```

### cell 8（code）

```python
d =  1 / sr
d
```

### cell 9（code）

```python
d_523 = 1 / 523
d_523
```

### cell 10（code）

```python
d_400_samples = 400 * d
d_400_samples
```

### cell 11（code）

```python
# zomm in to the waveform
samples = range(len(signal))
t = librosa.samples_to_time(samples, sr=sr)

plt.figure(figsize=(18, 8))
plt.plot(t[10000:10400], signal[10000:10400]) 
plt.xlabel("Time (s)")
plt.ylabel("Amplitude")
plt.show()
```

### cell 12（code）

```python
# create a sinusoid

f = 523
phase = 0
phase2 = 0.2

sin = 0.5 * np.sin(2*np.pi * (f * t - phase))
sin2 = 0.5 * np.sin(2*np.pi * (f * t - phase2))

plt.figure(figsize=(18, 8))
plt.plot(t[10000:10400], sin[10000:10400], color="r")
plt.plot(t[10000:10400], sin2[10000:10400], color="y")


plt.xlabel("Time (s)")
plt.ylabel("Amplitude")
plt.show()
```

### cell 13（code）

```python
# compare signal and sinusoids

f = 523
phase = 0.55

sin = 0.1 * np.sin(2*np.pi * (f * t - phase))

plt.figure(figsize=(18, 8))
plt.plot(t[10000:10400], signal[10000:10400]) 
plt.plot(t[10000:10400], sin[10000:10400], color="r")

plt.fill_between(t[10000:10400], sin[10000:10400]*signal[10000:10400], color="y")

plt.xlabel("Time (s)")
plt.ylabel("Amplitude")
plt.show()
```

### cell 14（code）

```python
# plot spectrum
plt.figure(figsize=(18, 8))
plt.plot(frequency[:5000], magnitude[:5000]) # magnitude spectrum
plt.xlabel("Frequency (Hz)")
plt.ylabel("Magnitude")
plt.show()
```

### cell 15（code）

```python
# superimposing pure tones
f = 1
t = np.linspace(0, 10, 10000)

sin = np.sin(2*np.pi * (f * t))
sin2 = np.sin(2*np.pi * (2*f * t))
sin3 = np.sin(2*np.pi * (3*f * t))

sum_signal = sin + sin2 + sin3

plt.figure(figsize=(15, 10))

plt.subplot(4, 1, 1)
plt.plot(t, sum_signal, color="r")

plt.subplot(4, 1, 2)
plt.plot(t, sin)

plt.subplot(4, 1, 3)
plt.plot(t, sin2)

plt.subplot(4, 1, 4)
plt.plot(t, sin3)

plt.show()
```

# 第 03 课 · Intensity, loudness, and timbre

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Intensity, loudness, and timbre.pdf

共 32 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Intensity, loudness, and timbre
Valerio Velardo

### p2

The power of sound!

### p3

Sound power
Rate at which energy is transferred
Energy per unit of time emitted by a sound source in all directions
Measured in watt (W)

### p4

Sound intensity
Sound power per unit area
Measured in W/m2

### p7

1 Watt

### p8

= 100 W

### p9

Threshold of hearing
Human can perceive sounds with very small intensities

### p11

Threshold of pain

### p12

Intensity level
Logarithmic scale
Measured in decibels (dB)
Ration between two intensity values
Use an intensity of reference (TOH)

### p13

Intensity level

### p15

Intensity level
log(1) = 0

### p16

Intensity level
Every ~3 dBs, intensity doubles

### p17

Intensity level

### p18

Loudness
Subjective perception of sound intensity
Depends on duration / frequency of a sound
Depends on age
Measured in phons

### p19

Equal loudness contours

### p20

Timbre

### p24

Timbre
Colour of sound
Diff between two sounds with same intensity, frequency, duration
Described with words like: bright, dark, dull, harsh, warm

### p26

What are the features of timbre?
Timbre is multidimensional
Sound envelope
Harmonic content
Amplitude / frequency modulation

### p27

Sound envelope
Attack-Decay-Sustain-Release Model

### p28

Sound envelope

### p32

Complex sound
Superposition of sinusoids
A partial is a sinusoid used to describe a sound
The lowest partial is called fundamental frequency
A harmonic partial is a frequency that’s a multiple of the fundamental
frequency

### p36

Complex sound
Superposition of sinusoids
A partial is a sinusoid used to describe a sound
The lowest partial is called fundamental frequency
A harmonic partial is a frequency that’s a multiple of the fundamental
frequency
Inharmonicity indicates a deviation from a harmonic partial

### p37

Harmonic vs inharmonic instruments

### p38

Harmonic content

### p39

Frequency modulation
AKA vibrato
Periodic variation in frequency
In music, used for expressive purposes

### p40

Frequency modulation

### p41

Amplitude modulation
AKA tremolo
Periodic variation in amplitude
In music, used for expressive purposes

### p42

Amplitude modulation

### p43

Timbre recap
Multifactorial sound dimension
Amplitude envelope
Distribution of energy across partials
Signal modulation (frequency/amplitude)

### p44

Sound recap
Sound is a wave
Frequency, intensity, timbre
Pitch, loudness, timbre

### p45

What’s up next?
Introducing audio signal
Audio to Digital Conversion (ADC)
Digital to Audio Conversion (DAC)

### p46

Join the community!
thesoundofai.slack.com

## intensity_and_timbre.ipynb

### cell 1（code）

```python
import os
import matplotlib.pyplot as plt
import librosa
import numpy as np
import IPython.display as ipd
```

### cell 2（code）

```python
BASE_FOLDER = "../audio_resources/"
violin_sound_file = "violin_c.wav"
piano_sound_file = "piano_c.wav"
tremolo_sound_file = "tremolo.wav"
```

### cell 3（code）

```python
# load sounds
violin_c4, _ = librosa.load(os.path.join(BASE_FOLDER, violin_sound_file))
piano_c5, _ = librosa.load(os.path.join(BASE_FOLDER, piano_sound_file))
```

### cell 4（code）

```python
def plot_spectrogram(signal, name):
    """Compute power spectrogram with Short-Time Fourier Transform and plot result."""
    spectrogram = librosa.amplitude_to_db(np.abs(librosa.stft(signal)))
    plt.figure(figsize=(20, 15))
    librosa.display.specshow(spectrogram, y_axis="log")
    plt.colorbar(format="%+2.0f dB")
    plt.title(f"Log-frequency power spectrogram for {name}")
    plt.xlabel("Time")
    plt.show()
```

### cell 5（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, violin_sound_file))
```

### cell 6（code）

```python
plot_spectrogram(violin_c4, "c4 on violin")
```

### cell 7（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, piano_sound_file))
```

### cell 8（code）

```python
plot_spectrogram(piano_c5, "c5 on piano")
```

### cell 9（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, tremolo_sound_file))
```

### cell 10（code）

```python
import numpy as np
```

### cell 11（code）

```python
X = np.fft.fft(violin_c4)
```

### cell 12（code）

```python
X_mag = np.absolute(X)
f = np.linspace(0, _, len(X_mag))
```

### cell 13（code）

```python
plt.figure(figsize=(18, 10))
plt.plot(f, X_mag) # magnitude spectrum
plt.xlabel('Frequency (Hz)')
```

### cell 14（code）

```python
len(violin_c4)
```

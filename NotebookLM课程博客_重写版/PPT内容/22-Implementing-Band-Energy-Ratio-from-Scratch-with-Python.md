# 第 22 课 · Implementing Band Energy Ratio from Scratch with Python

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Implementing band energy ratio from scratch.ipynb

### cell 1（code）

```python
import os
import math
import matplotlib.pyplot as plt
import numpy as np
import librosa
import IPython.display as ipd
```

### cell 2（markdown）

## Loading audio files

### cell 3（code）

```python
BASE_FOLDER = "../audio_resources/"
scale_file = os.path.join(BASE_FOLDER, "scale.wav")
debussy_file = os.path.join(BASE_FOLDER, "debussy.wav")
redhot_file = os.path.join(BASE_FOLDER, "redhot.wav")
duke_file = os.path.join(BASE_FOLDER, "duke.wav")
```

### cell 4（code）

```python
ipd.Audio(debussy_file)
```

### cell 5（code）

```python
ipd.Audio(redhot_file)
```

### cell 6（code）

```python
# load audio files with librosa
debussy, sr = librosa.load(debussy_file)
redhot, _ = librosa.load(redhot_file)
duke, _ = librosa.load(duke_file)
```

### cell 7（markdown）

## Extract spectrograms

### cell 8（code）

```python
FRAME_SIZE = 2048
HOP_SIZE = 512

debussy_spec = librosa.stft(debussy, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
redhot_spec = librosa.stft(redhot, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
duke_spec = librosa.stft(duke, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
```

### cell 9（code）

```python
debussy_spec.shape
```

### cell 10（markdown）

## Calculate Band Energy Ratio

### cell 11（code）

```python
def calculate_split_frequency_bin(split_frequency, sample_rate, num_frequency_bins):
    """Infer the frequency bin associated to a given split frequency."""
    
    frequency_range = sample_rate / 2
    frequency_delta_per_bin = frequency_range / num_frequency_bins
    split_frequency_bin = math.floor(split_frequency / frequency_delta_per_bin)
    return int(split_frequency_bin)
```

### cell 12（code）

```python
split_frequency_bin = calculate_split_frequency_bin(2000, 22050, 1025)
split_frequency_bin
```

### cell 13（code）

```python
def band_energy_ratio(spectrogram, split_frequency, sample_rate):
    """Calculate band energy ratio with a given split frequency."""
    
    split_frequency_bin = calculate_split_frequency_bin(split_frequency, sample_rate, len(spectrogram[0]))
    band_energy_ratio = []
    
    # calculate power spectrogram
    power_spectrogram = np.abs(spectrogram) ** 2
    power_spectrogram = power_spectrogram.T
    
    # calculate BER value for each frame
    for frame in power_spectrogram:
        sum_power_low_frequencies = frame[:split_frequency_bin].sum()
        sum_power_high_frequencies = frame[split_frequency_bin:].sum()
        band_energy_ratio_current_frame = sum_power_low_frequencies / sum_power_high_frequencies
        band_energy_ratio.append(band_energy_ratio_current_frame)
    
    return np.array(band_energy_ratio)
```

### cell 14（code）

```python
ber_debussy = band_energy_ratio(debussy_spec, 2000, sr)
ber_redhot = band_energy_ratio(redhot_spec, 2000, sr)
ber_duke = band_energy_ratio(duke_spec, 2000, sr)
```

### cell 15（code）

```python
len(ber_debussy)
```

### cell 16（markdown）

## Visualise Band Energy Ratio

### cell 17（code）

```python
frames = range(len(ber_debussy))
t = librosa.frames_to_time(frames, hop_length=HOP_SIZE)
```

### cell 18（code）

```python
plt.figure(figsize=(25, 10))

plt.plot(t, ber_debussy, color="b")
plt.plot(t, ber_redhot, color="r")
plt.plot(t, ber_duke, color="y")
plt.ylim((0, 20000))
plt.show()
```

# 第 14 课 · Extracting the Discrete Fourier Transform

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Visualising the Power Spectrum.ipynb

### cell 1（code）

```python
import os
import matplotlib.pyplot as plt
import librosa
import IPython.display as ipd
import numpy as np
```

### cell 2（code）

```python
BASE_FOLDER = "../audio_resources/"
violin_sound_file = os.path.join(BASE_FOLDER, "violin_c.wav")
piano_sound_file = os.path.join(BASE_FOLDER, "piano_c.wav")
sax_sound_file = os.path.join(BASE_FOLDER, "sax.wav")
noise_sound_file = os.path.join(BASE_FOLDER, "noise.wav")
```

### cell 3（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, violin_sound_file))
```

### cell 4（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, piano_sound_file))
```

### cell 5（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, sax_sound_file))
```

### cell 6（code）

```python
ipd.Audio(os.path.join(BASE_FOLDER, noise_sound_file))
```

### cell 7（code）

```python
# load sounds
violin_c4, sr = librosa.load(os.path.join(BASE_FOLDER, violin_sound_file))
piano_c5, _ = librosa.load(os.path.join(BASE_FOLDER, piano_sound_file))
sax_c4, _ = librosa.load(os.path.join(BASE_FOLDER, sax_sound_file))
noise, _ = librosa.load(os.path.join(BASE_FOLDER, noise_sound_file))
```

### cell 8（code）

```python
len(violin_c4)
```

### cell 9（code）

```python
X = np.fft.fft(violin_c4)
len(X)
```

### cell 10（code）

```python
def plot_magnitude_spectrum(signal, sr, title, f_ratio=1):
    X = np.fft.fft(signal)
    X_mag = np.absolute(X)
    
    plt.figure(figsize=(18, 5))
    
    f = np.linspace(0, sr, len(X_mag))
    f_bins = int(len(X_mag)*f_ratio)  
    
    plt.plot(f[:f_bins], X_mag[:f_bins])
    plt.xlabel('Frequency (Hz)')
    plt.title(title)
```

### cell 11（code）

```python
plot_magnitude_spectrum(violin_c4, sr, "violin", 0.1)
```

### cell 12（code）

```python
plot_magnitude_spectrum(piano_c5, sr, "piano", 0.1)
```

### cell 13（code）

```python
plot_magnitude_spectrum(sax_c4, sr, "sax", 0.1)
```

### cell 14（code）

```python
plot_magnitude_spectrum(noise, sr, "noise", 0.1)
```

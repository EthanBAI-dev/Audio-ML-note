# 第 16 课 · Extracting Spectrograms from Audio with Python

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Extracting Spectrograms from Audio with Python.ipynb

### cell 1（code）

```python
import os
import librosa
import IPython.display as ipd
import numpy as np
import matplotlib.pyplot as plt
```

### cell 2（markdown）

## Loading audio files with Librosa

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
ipd.Audio(scale_file)
```

### cell 5（code）

```python
ipd.Audio(debussy_file)
```

### cell 6（code）

```python
ipd.Audio(redhot_file)
```

### cell 7（code）

```python
ipd.Audio(duke_file)
```

### cell 8（code）

```python
# load audio files with librosa
scale, sr = librosa.load(scale_file)
debussy, _ = librosa.load(debussy_file)
redhot, _ = librosa.load(redhot_file)
duke, _ = librosa.load(duke_file)
```

### cell 9（markdown）

## Extracting Short-Time Fourier Transform

### cell 10（code）

```python
FRAME_SIZE = 2048
HOP_SIZE = 512
```

### cell 11（code）

```python
S_scale = librosa.stft(scale, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
```

### cell 12（code）

```python
S_scale.shape
```

### cell 13（code）

```python
type(S_scale[0][0])
```

### cell 14（markdown）

## Calculating the spectrogram

### cell 15（code）

```python
Y_scale = np.abs(S_scale) ** 2
```

### cell 16（code）

```python
Y_scale.shape
```

### cell 17（code）

```python
type(Y_scale[0][0])
```

### cell 18（markdown）

## Visualizing the spectrogram

### cell 19（code）

```python
def plot_spectrogram(Y, sr, hop_length, y_axis="linear"):
    plt.figure(figsize=(25, 10))
    librosa.display.specshow(Y, 
                             sr=sr, 
                             hop_length=hop_length, 
                             x_axis="time", 
                             y_axis=y_axis)
    plt.colorbar(format="%+2.f")
```

### cell 20（code）

```python
plot_spectrogram(Y_scale, sr, HOP_SIZE)
```

### cell 21（markdown）

## Log-Amplitude Spectrogram

### cell 22（code）

```python
Y_log_scale = librosa.power_to_db(Y_scale)
plot_spectrogram(Y_log_scale, sr, HOP_SIZE)
```

### cell 23（markdown）

## Log-Frequency Spectrogram

### cell 24（code）

```python
plot_spectrogram(Y_log_scale, sr, HOP_SIZE, y_axis="log")
```

### cell 25（markdown）

## Visualising songs from different genres

### cell 26（code）

```python
S_debussy = librosa.stft(debussy, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
S_redhot = librosa.stft(redhot, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)
S_duke = librosa.stft(duke, n_fft=FRAME_SIZE, hop_length=HOP_SIZE)


Y_debussy = librosa.power_to_db(np.abs(S_debussy) ** 2)
Y_redhot = librosa.power_to_db(np.abs(S_redhot) ** 2)
Y_duke = librosa.power_to_db(np.abs(S_duke) ** 2)

plot_spectrogram(Y_debussy, sr, HOP_SIZE, y_axis="log")
plot_spectrogram(Y_redhot, sr, HOP_SIZE, y_axis="log")
plot_spectrogram(Y_duke, sr, HOP_SIZE, y_axis="log")
```

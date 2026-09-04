# 第 18 课 · Extracting Mel Spectrograms with Python

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Extracting Mel Spectrograms.ipynb

### cell 1（code）

```python
import os
import librosa
import IPython.display as ipd
import matplotlib.pyplot as plt
```

### cell 2（markdown）

## Loading audio files with Librosa

### cell 3（code）

```python
BASE_FOLDER = "../audio_resources/"
scale_file = os.path.join(BASE_FOLDER, "scale.wav")
```

### cell 4（code）

```python
ipd.Audio(scale_file)
```

### cell 5（code）

```python
# load audio files with librosa
scale, sr = librosa.load(scale_file)
```

### cell 6（markdown）

## Mel filter banks

### cell 7（code）

```python
filter_banks = librosa.filters.mel(n_fft=2048, sr=22050, n_mels=10)
```

### cell 8（code）

```python
filter_banks.shape
```

### cell 9（code）

```python
plt.figure(figsize=(25, 10))
librosa.display.specshow(filter_banks, 
                         sr=sr, 
                         x_axis="linear")
plt.colorbar(format="%+2.f")
plt.show()
```

### cell 10（markdown）

## Extracting Mel Spectrogram

### cell 11（code）

```python
mel_spectrogram = librosa.feature.melspectrogram(y=scale, sr=sr, n_fft=2048, hop_length=512, n_mels=10)
```

### cell 12（code）

```python
mel_spectrogram.shape
```

### cell 13（code）

```python
log_mel_spectrogram = librosa.power_to_db(mel_spectrogram)
```

### cell 14（code）

```python
log_mel_spectrogram.shape
```

### cell 15（code）

```python
plt.figure(figsize=(25, 10))
librosa.display.specshow(log_mel_spectrogram, 
                         x_axis="time",
                         y_axis="mel", 
                         sr=sr)
plt.colorbar(format="%+2.f")
plt.show()
```

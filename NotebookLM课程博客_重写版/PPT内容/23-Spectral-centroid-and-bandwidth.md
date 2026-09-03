# 第 23 课 · Spectral centroid and bandwidth

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Spectral centroid and bandwidth.ipynb

### cell 1（code）

```python
import os
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
ipd.Audio(duke_file)
```

### cell 7（code）

```python
# load audio files with librosa
debussy, sr = librosa.load(debussy_file)
redhot, _ = librosa.load(redhot_file)
duke, _ = librosa.load(duke_file)
```

### cell 8（markdown）

## Spectral centroid with Librosa

### cell 9（code）

```python
FRAME_SIZE = 1024
HOP_LENGTH = 512
```

### cell 10（code）

```python
sc_debussy = librosa.feature.spectral_centroid(y=debussy, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
sc_redhot = librosa.feature.spectral_centroid(y=redhot, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
sc_duke = librosa.feature.spectral_centroid(y=duke, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
```

### cell 11（code）

```python
sc_debussy.shape
```

### cell 12（markdown）

## Visualising spectral centroid

### cell 13（code）

```python
frames = range(len(sc_debussy))
t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)
```

### cell 14（code）

```python
len(t)
```

### cell 15（code）

```python
plt.figure(figsize=(25,10))

plt.plot(t, sc_debussy, color='b')
plt.plot(t, sc_redhot, color='r')
plt.plot(t, sc_duke, color='y')

plt.show()
```

### cell 16（markdown）

## Spectral bandwidth with Librosa

### cell 17（code）

```python
ban_debussy = librosa.feature.spectral_bandwidth(y=debussy, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
ban_redhot = librosa.feature.spectral_bandwidth(y=redhot, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
ban_duke = librosa.feature.spectral_bandwidth(y=duke, sr=sr, n_fft=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
```

### cell 18（code）

```python
ban_debussy.shape
```

### cell 19（markdown）

## Visualising spectral bandwidth

### cell 20（code）

```python
plt.figure(figsize=(25,10))

plt.plot(t, ban_debussy, color='b')
plt.plot(t, ban_redhot, color='r')
plt.plot(t, ban_duke, color='y')

plt.show()
```

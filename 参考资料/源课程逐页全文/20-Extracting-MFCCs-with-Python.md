# 第 20 课 · Extracting MFCCs with Python

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Extracting MFCCs.ipynb

### cell 1（code）

```python
import os
import librosa
import IPython.display as ipd
import matplotlib.pyplot as plt
import numpy as np
```

### cell 2（markdown）

## Loading audio files with Librosa

### cell 3（code）

```python
BASE_FOLDER = "../audio_resources/"
audio_file = os.path.join(BASE_FOLDER, "debussy.wav")
```

### cell 4（code）

```python
ipd.Audio(audio_file)
```

### cell 5（code）

```python
# load audio files with librosa
signal, sr = librosa.load(audio_file)
```

### cell 6（markdown）

## Extracting MFCCs

### cell 7（code）

```python
mfccs = librosa.feature.mfcc(y=signal, n_mfcc=13, sr=sr)
```

### cell 8（code）

```python
mfccs.shape
```

### cell 9（markdown）

## Visualising MFCCs

### cell 10（code）

```python
plt.figure(figsize=(25, 10))
librosa.display.specshow(mfccs, 
                         x_axis="time", 
                         sr=sr)
plt.colorbar(format="%+2.f")
plt.show()
```

### cell 11（markdown）

## Computing first / second MFCCs derivatives

### cell 12（code）

```python
delta_mfccs = librosa.feature.delta(mfccs)
```

### cell 13（code）

```python
delta2_mfccs = librosa.feature.delta(mfccs, order=2)
```

### cell 14（code）

```python
delta_mfccs.shape
```

### cell 15（code）

```python
plt.figure(figsize=(25, 10))
librosa.display.specshow(delta_mfccs, 
                         x_axis="time", 
                         sr=sr)
plt.colorbar(format="%+2.f")
plt.show()
```

### cell 16（code）

```python
plt.figure(figsize=(25, 10))
librosa.display.specshow(delta2_mfccs, 
                         x_axis="time", 
                         sr=sr)
plt.colorbar(format="%+2.f")
plt.show()
```

### cell 17（code）

```python
mfccs_features = np.concatenate((mfccs, delta_mfccs, delta2_mfccs))
```

### cell 18（code）

```python
mfccs_features.shape
```

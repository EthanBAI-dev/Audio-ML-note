# 第 09 课 · RMS energy and zero-crossing rate

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## RMS Energy and Zero-Crossing Rate.ipynb

### cell 1（code）

```python
import os
import matplotlib.pyplot as plt
import numpy as np
import librosa
import IPython.display as ipd
```

### cell 2（markdown）

## Loading Audio Files

### cell 3（code）

```python
BASE_FOLDER = "../audio_resources/"
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

## Root-mean-squared energy with Librosa

### cell 9（code）

```python
FRAME_SIZE = 1024
HOP_LENGTH = 512
```

### cell 10（code）

```python
rms_debussy = librosa.feature.rms(y=debussy, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
rms_redhot = librosa.feature.rms(y=redhot, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
rms_duke = librosa.feature.rms(y=duke, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
```

### cell 11（markdown）

## Visualise RMSE + waveform

### cell 12（code）

```python
frames = range(len(rms_debussy))
t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)
```

### cell 13（code）

```python
# rms energy is graphed in red

plt.figure(figsize=(15, 17))

ax = plt.subplot(3, 1, 1)
librosa.display.waveshow(debussy, alpha=0.5)
plt.plot(t, rms_debussy, color="r")
plt.ylim((-1, 1))
plt.title("Debusy")

plt.subplot(3, 1, 2)
librosa.display.waveshow(redhot, alpha=0.5)
plt.plot(t, rms_redhot, color="r")
plt.ylim((-1, 1))
plt.title("RHCP")

plt.subplot(3, 1, 3)
librosa.display.waveshow(duke, alpha=0.5)
plt.plot(t, rms_duke, color="r")
plt.ylim((-1, 1))
plt.title("Duke Ellington")

plt.show()
```

### cell 14（markdown）

## RMSE from scratch

### cell 15（code）

```python
def rmse(signal, frame_size, hop_length):
    rmse = []
    
    # calculate rmse for each frame
    for i in range(0, len(signal), hop_length): 
        rmse_current_frame = np.sqrt(sum(signal[i:i+frame_size]**2) / frame_size)
        rmse.append(rmse_current_frame)
    return np.array(rmse)
```

### cell 16（code）

```python
rms_debussy1 = rmse(debussy, FRAME_SIZE, HOP_LENGTH)
rms_redhot1 = rmse(redhot, FRAME_SIZE, HOP_LENGTH)
rms_duke1 = rmse(duke, FRAME_SIZE, HOP_LENGTH)
```

### cell 17（code）

```python
plt.figure(figsize=(15, 17))

ax = plt.subplot(3, 1, 1)
librosa.display.waveshow(debussy, alpha=0.5)
plt.plot(t, rms_debussy, color="r")
plt.plot(t, rms_debussy1, color="y")
plt.ylim((-1, 1))
plt.title("Debusy")

plt.subplot(3, 1, 2)
librosa.display.waveshow(redhot, alpha=0.5)
plt.plot(t, rms_redhot, color="r")
plt.plot(t, rms_redhot1, color="y")
plt.ylim((-1, 1))
plt.title("RHCP")

plt.subplot(3, 1, 3)
librosa.display.waveshow(duke, alpha=0.5)
plt.plot(t, rms_duke, color="r")
plt.plot(t, rms_duke1, color="y")
plt.ylim((-1, 1))
plt.title("Duke Ellington")

plt.show()
```

### cell 18（markdown）

## Zero-crossing rate with Librosa

### cell 19（code）

```python
zcr_debussy = librosa.feature.zero_crossing_rate(debussy, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
zcr_redhot = librosa.feature.zero_crossing_rate(redhot, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
zcr_duke = librosa.feature.zero_crossing_rate(duke, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
```

### cell 20（code）

```python
zcr_debussy.size
```

### cell 21（markdown）

## Visualise zero-crossing rate with Librosa

### cell 22（code）

```python
plt.figure(figsize=(15, 10))

plt.plot(t, zcr_debussy, color="y")
plt.plot(t, zcr_redhot, color="r")
plt.plot(t, zcr_duke, color="b")
plt.ylim(0, 1)
plt.show()
```

### cell 23（markdown）

## ZCR: Voice vs Noise

### cell 24（code）

```python
voice_file = os.path.join(BASE_FOLDER, "voice.wav")
noise_file = os.path.join(BASE_FOLDER, "noise.wav")
```

### cell 25（code）

```python
ipd.Audio(voice_file)
```

### cell 26（code）

```python
ipd.Audio(noise_file)
```

### cell 27（code）

```python
# load audio files
voice, _ = librosa.load(voice_file, duration=15)
noise, _ = librosa.load(noise_file, duration=15)
```

### cell 28（code）

```python
# get ZCR
zcr_voice = librosa.feature.zero_crossing_rate(voice, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
zcr_noise = librosa.feature.zero_crossing_rate(noise, frame_length=FRAME_SIZE, hop_length=HOP_LENGTH)[0]
```

### cell 29（code）

```python
frames = range(len(zcr_voice))
t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)
```

### cell 30（code）

```python
plt.figure(figsize=(15, 10))

plt.plot(t, zcr_voice, color="y")
plt.plot(t, zcr_noise, color="r")
plt.ylim(0, 1)
plt.show()
```

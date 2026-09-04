# 第 08 课 · Implementing the amplitude envelope

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Implementing the amplitude envelope.ipynb

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

## Basic information regarding audio files

### cell 9（code）

```python
debussy.shape
```

### cell 10（code）

```python
# duration in seconds of 1 sample
sample_duration = 1 / sr
print(f"One sample lasts for {sample_duration:6f} seconds")
```

### cell 11（code）

```python
# total number of samples in audio file
tot_samples = len(debussy)
tot_samples
```

### cell 12（code）

```python
# duration of debussy audio in seconds
duration = 1 / sr * tot_samples
print(f"The audio lasts for {duration} seconds")
```

### cell 13（markdown）

## Visualising audio signal in the time domain

### cell 14（code）

```python
plt.figure(figsize=(15, 17))

plt.subplot(3, 1, 1)
librosa.display.waveshow(debussy, alpha=0.5)
plt.ylim((-1, 1))
plt.title("Debusy")

plt.subplot(3, 1, 2)
librosa.display.waveshow(redhot, alpha=0.5)
plt.ylim((-1, 1))
plt.title("RHCP")

plt.subplot(3, 1, 3)
librosa.display.waveshow(duke, alpha=0.5)
plt.ylim((-1, 1))
plt.title("Duke Ellington")

plt.show()
```

### cell 15（markdown）

## Calculating amplitude envelope

### cell 16（code）

```python
FRAME_SIZE = 1024
HOP_LENGTH = 512

def amplitude_envelope(signal, frame_size, hop_length):
    """Calculate the amplitude envelope of a signal with a given frame size nad hop length."""
    amplitude_envelope = []
    
    # calculate amplitude envelope for each frame
    for i in range(0, len(signal), hop_length): 
        amplitude_envelope_current_frame = max(signal[i:i+frame_size]) 
        amplitude_envelope.append(amplitude_envelope_current_frame)
    
    return np.array(amplitude_envelope)
```

### cell 17（code）

```python
def fancy_amplitude_envelope(signal, frame_size, hop_length):
    """Fancier Python code to calculate the amplitude envelope of a signal with a given frame size."""
    return np.array([max(signal[i:i+frame_size]) for i in range(0, len(signal), hop_length)])
```

### cell 18（code）

```python
# number of frames in amplitude envelope
ae_debussy = amplitude_envelope(debussy, FRAME_SIZE, HOP_LENGTH)
len(ae_debussy)
```

### cell 19（code）

```python
# calculate amplitude envelope for RHCP and Duke Ellington
ae_redhot = amplitude_envelope(redhot, FRAME_SIZE, HOP_LENGTH)
ae_duke = amplitude_envelope(duke, FRAME_SIZE, HOP_LENGTH)
```

### cell 20（markdown）

## Visualising amplitude envelope

### cell 21（code）

```python
frames = range(len(ae_debussy))
t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)
```

### cell 22（code）

```python
# amplitude envelope is graphed in red

plt.figure(figsize=(15, 17))

ax = plt.subplot(3, 1, 1)
librosa.display.waveshow(debussy, alpha=0.5)
plt.plot(t, ae_debussy, color="r")
plt.ylim((-1, 1))
plt.title("Debusy")

plt.subplot(3, 1, 2)
librosa.display.waveshow(redhot, alpha=0.5)
plt.plot(t, ae_redhot, color="r")
plt.ylim((-1, 1))
plt.title("RHCP")

plt.subplot(3, 1, 3)
librosa.display.waveshow(duke, alpha=0.5)
plt.plot(t, ae_duke, color="r")
plt.ylim((-1, 1))
plt.title("Duke Ellington")

plt.show()
```

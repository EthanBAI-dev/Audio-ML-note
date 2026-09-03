# 第 12 课 · Defining the Fourier transform using complex numbers

> 由 `tools/extract-source-outline.py` 生成，**不要手改**。
> 这是逐页全文。写这一课之前先通读一遍，**文章的主线必须是这里的顺序**。
> 图、公式的配色标注抽不出来，需要时按页码翻原始 PDF。

## Defining the Fourier Transform Using  Complex Numbers.ipynb

### cell 1（code）

```python
import matplotlib.pyplot as plt
import numpy as np
```

### cell 2（code）

```python
def create_signal(frequency, time):
    sin = np.sin(2 * np.pi * (frequency * time))
    sin2 = np.sin(2 * np.pi * (2 * frequency * time))
    sin3 = np.sin(2 * np.pi * (3 * frequency * time))

    return sin + sin2 + sin3
```

### cell 3（code）

```python
def calculate_centre_of_gravity(mult_signal):
    x_centre = np.mean([x.real for x in mult_signal])
    y_centre = np.mean([x.imag for x in mult_signal])
    return x_centre, y_centre
```

### cell 4（code）

```python
def calculate_sum(mult_signal):
    x_sum = np.sum([x.real for x in mult_signal])
    y_sum = np.sum([x.imag for x in mult_signal])
    return x_sum, y_sum
```

### cell 5（code）

```python
def create_pure_tone(frequency, time):
    angle = -2 * np.pi * frequency * time
    return np.cos(angle) + 1j * np.sin(angle)
```

### cell 6（code）

```python
def plot_fourier_transform(pure_tone_frequency, 
                           signal_frequency, 
                           time, 
                           plot_centre_of_gravity=False,
                           plot_sum=False):
    
    # create sinusoid and signal
    pure_tone = create_pure_tone(pure_tone_frequency, time)
    signal = create_signal(signal_frequency, time)
    
    # multiply pure tone and signal
    mult_signal = pure_tone * signal
    
    X = [x.real for x in mult_signal]
    Y = [x.imag for x in mult_signal]

    plt.figure(figsize=(15, 10))
    plt.plot(X, Y, 'o')

    # calculate and plot centre of gravity
    if plot_centre_of_gravity:
        centre_of_gravity = calculate_centre_of_gravity(mult_signal)
        plt.plot([centre_of_gravity[0]], [centre_of_gravity[1]], marker='o', markersize=10, color="red")


    # calculate and plot sum 
    if plot_sum:
        integral = calculate_sum(mult_signal)
        plt.plot([integral[0]], [integral[1]], marker='o', markersize=10, color="green")

    
    # set origin axes
    ax = plt.gca()
    ax.grid(True)
    ax.spines['left'].set_position('zero')
    ax.spines['right'].set_color('none')
    ax.spines['bottom'].set_position('zero')
    ax.spines['top'].set_color('none')

    if not plot_sum:
        plt.xlim(-3, 3)
        plt.ylim(-3, 3)

    plt.show()
```

### cell 7（code）

```python
def plot_signal(signal, time):
    plt.figure(figsize=(15, 10))
    plt.plot(signal, time)
    plt.xlabel("Time")
    plt.ylabel("Intensity")
    plt.show()
```

### cell 8（code）

```python
time = np.linspace(0, 10, 10000)
signal = create_signal(frequency=1, time=time)
plot_signal(time, signal)
```

### cell 9（code）

```python
time = np.linspace(0, 1, 10000)
plot_fourier_transform(pure_tone_frequency=1.1,
                       signal_frequency=1,
                       time=time,
                       plot_centre_of_gravity=False,
                       plot_sum=False)
```

## Defining the Fourier Transform Using Complex Numbers.pdf

共 24 张有效幻灯片（逐条淡入的中间态已折叠）。

### p1

Valerio Velardo
Defining the Fourier Transform Using
Complex Numbers

### p2

Join the community!
thesoundofai.slack.com

### p3

Previously...

### p7

The intuition
Use magnitude and phase as polar coordinates
Encode both coefficients in a single complex number

### p8

Complex Fourier transform coefficients

### p15

Complex Fourier transform coefficients
Im
Re
cf
|c|

### p16

Complex Fourier transform coefficients
Im
Re
cf

### p20

Continuous audio signal

### p23

Complex Fourier transform

### p25

Complex Fourier transform
Im
Re
cf1

### p26

Complex Fourier transform
Im
Re
cf2

### p27

Complex Fourier transform
Im
Re
cf3

### p28

Complex Fourier transform

### p30

Complex Fourier transform
Im
Re
cf

### p31

Complex Fourier transform
Im
Re

### p32

Complex Fourier transform

### p37

Complex Fourier transform
Real part
Imaginary part

### p38

Magnitude Fourier transform

### p39

Magnitude and phase

### p44

Inverse Fourier transform
IFT

### p46

Fourier representation
Pure tone of frequency f

### p48

Fourier representation
Weight pure tone with magnitude and add phase

### p49

Fourier representation
Add up all (weighted) sinusoids

### p50

A Fourier roundtrip

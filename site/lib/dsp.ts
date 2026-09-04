// 浏览器端最小 DSP 工具集。实现刻意和课程里的 Python 保持同一套约定：
// 实数 FFT 只取 0..N/2，频率轴用真实 Hz，窗默认 Hann。

export function hann(N: number): Float32Array {
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
  return w;
}
export function hamming(N: number): Float32Array {
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / N);
  return w;
}
export function rect(N: number): Float32Array {
  return new Float32Array(N).fill(1);
}
export const WINDOWS = { hann, hamming, rect } as const;
export type WindowName = keyof typeof WINDOWS;

/** 原地 radix-2 FFT。len 必须是 2 的幂。 */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

/** 实数序列的单边幅度谱。返回长度 N/2+1。 */
export function magnitudeSpectrum(x: Float32Array): Float32Array {
  const n = x.length;
  const re = Float32Array.from(x), im = new Float32Array(n);
  fft(re, im);
  const out = new Float32Array(n / 2 + 1);
  for (let k = 0; k <= n / 2; k++) out[k] = Math.hypot(re[k], im[k]) / n;
  return out;
}

export function binFrequencies(n: number, sr: number): Float32Array {
  const f = new Float32Array(n / 2 + 1);
  for (let k = 0; k <= n / 2; k++) f[k] = (k * sr) / n;
  return f;
}

export type Partial = { hz: number; amp: number };

/** 由若干正弦叠加成一段信号；noise 是加进去的白噪声幅度。 */
export function synth(partials: Partial[], n: number, sr: number, noise = 0): Float32Array {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const p of partials) v += p.amp * Math.sin((2 * Math.PI * p.hz * i) / sr);
    if (noise) v += noise * (Math.random() * 2 - 1);
    x[i] = v;
  }
  return x;
}

export const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
export const melToHz = (mel: number) => 700 * (10 ** (mel / 2595) - 1);

/** 三角梅尔滤波器组，返回 nMels 行、每行长度 nBins 的权重。 */
export function melFilterbank(nMels: number, nBins: number, sr: number, fMin = 0, fMax = sr / 2) {
  const pts = new Float64Array(nMels + 2);
  const lo = hzToMel(fMin), hi = hzToMel(fMax);
  for (let i = 0; i < pts.length; i++) pts[i] = melToHz(lo + ((hi - lo) * i) / (nMels + 1));
  const binHz = (k: number) => (k * sr) / (2 * (nBins - 1));
  const fb: Float32Array[] = [];
  for (let m = 1; m <= nMels; m++) {
    const row = new Float32Array(nBins);
    const [l, c, r] = [pts[m - 1], pts[m], pts[m + 1]];
    for (let k = 0; k < nBins; k++) {
      const f = binHz(k);
      if (f >= l && f <= c && c > l) row[k] = (f - l) / (c - l);
      else if (f > c && f <= r && r > c) row[k] = (r - f) / (r - c);
    }
    fb.push(row);
  }
  return { filters: fb, centers: Array.from(pts).slice(1, nMels + 1) };
}

/** DCT-II，用于从对数梅尔谱得到倒谱系数。 */
export function dct2(x: Float32Array): Float32Array {
  const N = x.length, out = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    let s = 0;
    for (let n = 0; n < N; n++) s += x[n] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * N));
    out[k] = s * (k === 0 ? Math.sqrt(1 / (4 * N)) : Math.sqrt(1 / (2 * N))) * 2;
  }
  return out;
}
export function idct2(c: Float32Array, N: number): Float32Array {
  const out = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (let k = 0; k < c.length; k++) {
      const w = k === 0 ? Math.sqrt(1 / (4 * N)) : Math.sqrt(1 / (2 * N));
      s += 2 * w * c[k] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * N));
    }
    out[n] = s;
  }
  return out;
}

/** 频谱质心与 p 范数带宽，权重用幅度，频率用真实 Hz。 */
export function centroidBandwidth(mag: Float32Array, freq: Float32Array, p = 2) {
  let sum = 0, wsum = 0;
  for (let k = 0; k < mag.length; k++) { sum += mag[k]; wsum += mag[k] * freq[k]; }
  if (sum === 0) return { centroid: 0, bandwidth: 0 };
  const centroid = wsum / sum;
  let acc = 0;
  for (let k = 0; k < mag.length; k++) acc += mag[k] * Math.abs(freq[k] - centroid) ** p;
  return { centroid, bandwidth: (acc / sum) ** (1 / p) };
}

/** 带能量比：分界频率两侧的功率之比，同时给出 dB 值与分界格号。 */
export function bandEnergyRatio(mag: Float32Array, freq: Float32Array, splitHz: number) {
  let split = freq.length;
  for (let k = 0; k < freq.length; k++) if (freq[k] >= splitHz) { split = k; break; }
  let lo = 0, hi = 0;
  for (let k = 0; k < mag.length; k++) (k < split ? (lo += mag[k] ** 2) : (hi += mag[k] ** 2));
  const ratio = hi === 0 ? Infinity : lo / hi;
  return { split, splitBinHz: freq[split] ?? NaN, low: lo, high: hi, ratio, db: 10 * Math.log10(ratio) };
}

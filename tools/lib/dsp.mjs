// 纯 Node 的最小音频 DSP 工具：读 WAV、FFT、STFT、梅尔滤波组。
// 不依赖 Python，用于从课程真实音频生成配图数据。

import { readFileSync } from 'node:fs';

// ---------- WAV ----------

/** 读取未压缩 WAV（PCM 16/24/32 位整数或 32 位浮点），返回单声道 Float64Array。 */
export function readWav(path) {
  const b = readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`不是 WAV 文件: ${path}`);
  }
  let pos = 12;
  let fmt = null;
  let data = null;
  while (pos + 8 <= b.length) {
    const id = b.toString('ascii', pos, pos + 4);
    const size = b.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') {
      fmt = {
        format: b.readUInt16LE(body),
        channels: b.readUInt16LE(body + 2),
        sampleRate: b.readUInt32LE(body + 4),
        bits: b.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      data = b.subarray(body, body + size);
    }
    pos = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`WAV 缺少 fmt 或 data 块: ${path}`);

  const { channels, bits, format } = fmt;
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const out = new Float64Array(frames);
  const scale = 1 / (2 ** (bits - 1));

  for (let i = 0; i < frames; i += 1) {
    let sum = 0;
    for (let c = 0; c < channels; c += 1) {
      const o = (i * channels + c) * bytes;
      let v;
      if (format === 3 && bits === 32) v = data.readFloatLE(o);
      else if (bits === 16) v = data.readInt16LE(o) * scale;
      else if (bits === 24) v = ((data[o] | (data[o + 1] << 8) | (data[o + 2] << 16) << 8 >> 8)) * scale;
      else if (bits === 32) v = data.readInt32LE(o) * scale;
      else if (bits === 8) v = (data[o] - 128) / 128;
      else throw new Error(`不支持的位深 ${bits}`);
      sum += v;
    }
    out[i] = sum / channels;
  }
  return { samples: out, sampleRate: fmt.sampleRate };
}

/** 线性插值重采样。教学用途足够，不做抗混叠滤波（源材料本身已带限）。 */
export function resample(samples, from, to) {
  if (from === to) return samples;
  const ratio = from / to;
  const n = Math.floor(samples.length / ratio);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const t = x - i0;
    out[i] = samples[i0] * (1 - t) + (samples[Math.min(i0 + 1, samples.length - 1)] ?? 0) * t;
  }
  return out;
}

export const slice = (samples, sr, startSec, durSec) =>
  samples.subarray(Math.floor(startSec * sr), Math.floor((startSec + durSec) * sr));

// ---------- FFT ----------

/** 原地迭代 radix-2 FFT。re / im 长度必须是 2 的幂。 */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

const hann = (n) => {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
};

/** 单帧幅度谱（已除以窗长，可跨帧比较）。 */
export function magnitudeSpectrum(frame, nfft = 2048) {
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  const w = hann(Math.min(frame.length, nfft));
  for (let i = 0; i < Math.min(frame.length, nfft); i += 1) re[i] = frame[i] * w[i];
  fft(re, im);
  const bins = nfft / 2 + 1;
  const mag = new Float64Array(bins);
  for (let k = 0; k < bins; k += 1) mag[k] = Math.hypot(re[k], im[k]) / (nfft / 2);
  return mag;
}

/**
 * 短时傅里叶变换。返回 { mag, frames, bins, hop, nfft, sampleRate }，
 * mag 为 Float32Array，按 [frame * bins + bin] 存放。
 */
export function stft(samples, sampleRate, { nfft = 1024, hop = 256 } = {}) {
  const bins = nfft / 2 + 1;
  const frames = Math.max(1, Math.floor((samples.length - nfft) / hop) + 1);
  const mag = new Float32Array(frames * bins);
  const w = hann(nfft);
  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);
  for (let f = 0; f < frames; f += 1) {
    const off = f * hop;
    for (let i = 0; i < nfft; i += 1) {
      re[i] = (samples[off + i] ?? 0) * w[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < bins; k += 1) mag[f * bins + k] = Math.hypot(re[k], im[k]) / (nfft / 2);
  }
  return { mag, frames, bins, hop, nfft, sampleRate };
}

export const toDb = (v, floor = 1e-6) => 20 * Math.log10(Math.max(v, floor));

/** 梅尔刻度（Slaney 之外最常见的 O'Shaughnessy 形式，与 librosa htk=True 一致）。 */
export const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
export const melToHz = (m) => 700 * (10 ** (m / 2595) - 1);

/** 三角梅尔滤波器组，返回 [nMels][bins] 权重。 */
export function melFilterbank(nMels, nfft, sampleRate, fmin = 0, fmax = sampleRate / 2) {
  const bins = nfft / 2 + 1;
  const mMin = hzToMel(fmin);
  const mMax = hzToMel(fmax);
  const pts = Array.from({ length: nMels + 2 }, (_, i) =>
    Math.floor(((nfft + 1) * melToHz(mMin + ((mMax - mMin) * i) / (nMels + 1))) / sampleRate));
  const fb = Array.from({ length: nMels }, () => new Float64Array(bins));
  for (let m = 1; m <= nMels; m += 1) {
    const [l, c, r] = [pts[m - 1], pts[m], pts[m + 1]];
    for (let k = l; k < c; k += 1) if (c > l) fb[m - 1][k] = (k - l) / (c - l);
    for (let k = c; k < r; k += 1) if (r > c) fb[m - 1][k] = (r - k) / (r - c);
  }
  return fb;
}

/** 合成一段"持续嗡嗡声 + 一次敲击"，用于需要与正文例子严格对应的图。 */
/** 确定性伪随机数，保证每次生成的图完全一致。 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function synthHumAndKnock(sampleRate = 16000, dur = 2.0, knockAt = 1.25) {
  const n = Math.floor(sampleRate * dur);
  const y = new Float64Array(n);
  const rnd = mulberry32(7);
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    // 基频 180 Hz 的电机嗡嗡声 + 两个谐波，带一点缓慢的强弱起伏
    const swell = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.7 * t);
    y[i] = swell * (0.30 * Math.sin(2 * Math.PI * 180 * t)
      + 0.16 * Math.sin(2 * Math.PI * 360 * t + 0.7)
      + 0.08 * Math.sin(2 * Math.PI * 540 * t + 1.9));
    y[i] += 0.004 * (rnd() * 2 - 1); // 很轻的底噪
  }
  // 一次宽带敲击：指数衰减包络 * 白噪声
  const k0 = Math.floor(knockAt * sampleRate);
  for (let i = 0; i < sampleRate * 0.18 && k0 + i < n; i += 1) {
    y[k0 + i] += 0.9 * Math.exp(-i / (sampleRate * 0.02)) * (rnd() * 2 - 1);
  }
  return { samples: y, sampleRate };
}

'use client';

/** 全站共用一个 AudioContext。浏览器要求在用户点击之后才能出声，所以首次播放时才 resume。 */
let ctx: AudioContext | null = null;
export function audioContext(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

/** 播放一段单声道数组，返回停止函数。峰值压到 0.5 以内，免得突然很响。 */
export function playSamples(x: Float32Array, sr: number, onEnd?: () => void): () => void {
  const ac = audioContext();
  void ac.resume();
  let peak = 0; for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  const k = peak > 0.5 ? 0.5 / peak : 1;
  const buf = ac.createBuffer(1, x.length, sr);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < x.length; i++) ch[i] = x[i] * k;
  const src = ac.createBufferSource();
  src.buffer = buf; src.connect(ac.destination);
  src.onended = () => onEnd?.();
  src.start();
  return () => { src.onended = null; try { src.stop(); } catch { /* 已经停了 */ } };
}

/** 读一段站内音频，重采样到课程统一的 22050 Hz 并混成单声道，帧长 1024 才和课程代码是同一个时长。 */
export async function loadMono(url: string, sr = 22050): Promise<{ x: Float32Array; sr: number; buffer: AudioBuffer }> {
  const data = await (await fetch(url)).arrayBuffer();
  const buffer = await new OfflineAudioContext(1, 1, sr).decodeAudioData(data);
  const n = buffer.length, c = buffer.numberOfChannels;
  const x = new Float32Array(n);
  for (let ch = 0; ch < c; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < n; i++) x[i] += d[i] / c;
  }
  return { x, sr: buffer.sampleRate, buffer };
}

/** 与课程代码同一口径：不补边分帧；过零次数除以相邻对的个数 K−1。 */
export function timeFeatures(x: Float32Array, K: number, H: number) {
  const n = x.length < K ? 0 : Math.floor((x.length - K) / H) + 1;
  const ae = new Float32Array(n), rms = new Float32Array(n), zcr = new Float32Array(n);
  for (let t = 0; t < n; t++) {
    let a = 0, s = 0, z = 0, prev = 0;
    for (let i = t * H; i < t * H + K; i++) {
      const v = x[i];
      a = Math.max(a, Math.abs(v)); s += v * v;
      const sg = Math.sign(v);
      if (sg !== 0) { if (prev !== 0 && sg !== prev) z += 1; prev = sg; }
    }
    ae[t] = a; rms[t] = Math.sqrt(s / K); zcr[t] = z / (K - 1);
  }
  return { ae, rms, zcr };
}

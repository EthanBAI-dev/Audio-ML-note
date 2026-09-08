'use client';

import { useEffect, useRef, useState } from 'react';
import { Lab } from './lab';

/** 换素材只改这一处。file 指向 public/audio/ 下的文件，answer 是正确答案。
 *  以后换成古典、爵士、摇滚三段音乐时，把这三行替换掉即可，下面的逻辑不用动。 */
const CLIPS = [
  { file: 'piano_c.wav', answer: '钢琴' },
  { file: 'violin_c.wav', answer: '小提琴' },
  { file: 'sax.wav', answer: '萨克斯' },
] as const;

const OPTIONS = CLIPS.map((c) => c.answer);
const SLOT = ['A', 'B', 'C'];
const CLIP_SECONDS = 1;

type Clip = (typeof CLIPS)[number];

function shuffled(): Clip[] {
  const list = [...CLIPS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** 找到真正出声的位置：整段开头可能有一小截静音，从那里截 1 秒才听得到东西。 */
function onsetIndex(data: Float32Array): number {
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > 0.02) return i;
  }
  return 0;
}

/** 播放要留一点起手，否则第一下会被切掉；取数字则从出声那一刻开始，
 *  提前量落在静音里的话，读者会看到一整行 0.000，像是坏了。 */
function playFrom(data: Float32Array, sampleRate: number): number {
  return Math.max(0, onsetIndex(data) - Math.round(sampleRate * 0.05));
}

/** 把这一秒的峰值拉到统一高度，免得读者靠「哪段更响」猜答案。 */
function evenGain(window: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < window.length; i++) peak = Math.max(peak, Math.abs(window[i]));
  return Math.min(4, 0.7 / Math.max(peak, 0.05));
}

function fmt(v: number): string {
  if (Math.abs(v) < 0.0005) return '0.000';          // 避免出现 −0.000
  return v < 0 ? `−${Math.abs(v).toFixed(3)}` : v.toFixed(3);
}

/** 第 01 课：读者一听就分得出，程序拿到的却只有一串数字。
 *  这里只呈现这个落差，不解释三段声音为什么不同——那是第 03 课的内容。 */
export default function BlindGuessLab() {
  const [order, setOrder] = useState<Clip[]>(shuffled);
  const [picks, setPicks] = useState<(string | null)[]>([null, null, null]);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [samples, setSamples] = useState<Record<string, number[]>>({});
  const [rate, setRate] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const raw = useRef<Record<string, ArrayBuffer>>({});
  const decoded = useRef<Record<string, AudioBuffer>>({});
  const ctx = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const timer = useRef<number>(0);

  // 文件先下好，解码等到用户第一次点播放时再做——浏览器要求先有点击才让出声。
  useEffect(() => {
    let alive = true;
    Promise.all(CLIPS.map(async (c) => {
      const res = await fetch(`/audio/${c.file}`);
      if (!res.ok) throw new Error(c.file);
      raw.current[c.file] = await res.arrayBuffer();
    })).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    try { source.current?.stop(); } catch { /* 已经停了 */ }
    void ctx.current?.close();
  }, []);

  async function buffer(file: string): Promise<AudioBuffer> {
    ctx.current ??= new AudioContext();
    const context = ctx.current;
    await context.resume();
    if (!decoded.current[file]) {
      decoded.current[file] = await context.decodeAudioData(raw.current[file].slice(0));
    }
    return decoded.current[file];
  }

  function stop() {
    window.clearTimeout(timer.current);
    try { source.current?.stop(); } catch { /* 已经停了 */ }
    source.current = null;
    setPlaying(null);
  }

  async function play(slot: number) {
    if (playing === slot) { stop(); return; }
    stop();
    try {
      const buf = await buffer(order[slot].file);
      const context = ctx.current!;
      const data = buf.getChannelData(0);
      const from = playFrom(data, buf.sampleRate);
      const node = context.createBufferSource();
      node.buffer = buf;
      // 三段素材的峰值本来差了十几倍，不拉平的话响度会直接把答案透露出去。
      const gain = context.createGain();
      gain.gain.value = evenGain(data.subarray(from, from + buf.sampleRate * CLIP_SECONDS));
      node.connect(gain).connect(context.destination);
      node.start(0, from / buf.sampleRate, CLIP_SECONDS);
      source.current = node;
      setPlaying(slot);
      timer.current = window.setTimeout(() => setPlaying(null), CLIP_SECONDS * 1000);
    } catch {
      setFailed(true);
    }
  }

  /** 揭晓时把声音刚开始的几个数取出来——和刚才播放的是同一段。 */
  async function reveal() {
    setRevealed(true);
    try {
      const rows: Record<string, number[]> = {};
      let sr = 0;
      for (const clip of order) {
        const buf = await buffer(clip.file);
        const data = buf.getChannelData(0);
        const from = onsetIndex(data);
        rows[clip.file] = Array.from(data.slice(from, from + 8));
        sr = buf.sampleRate;
      }
      setSamples(rows);
      setRate(sr);
    } catch {
      setFailed(true);
    }
  }

  function again() {
    stop();
    setOrder(shuffled());
    setPicks([null, null, null]);
    setRevealed(false);
    setSamples({});
  }

  const answered = picks.every(Boolean);
  const correct = order.filter((c, i) => picks[i] === c.answer).length;

  return (
    <Lab title="先听一遍：你分得出，程序只拿到一串数字"
      hint={`三段 1 秒的声音顺序是打乱的。先点播放，再给每段选一个来源，选完点「看答案」。${failed ? '' : '声音只在点击后播放。'}`}>
      <>
        {order.map((clip, slot) => {
          const hit = picks[slot] === clip.answer;
          return (
            <div key={SLOT[slot]} className="lab-choice">
              <span className="lab-slider-label">
                声音 {SLOT[slot]}
                {revealed ? <b style={{ marginLeft: 6 }}>{hit ? '✓' : '✗'}</b> : null}
              </span>
              <div role="group">
                <button type="button" className="lab-audio-button" disabled={failed}
                  aria-pressed={playing === slot}
                  onClick={() => void play(slot)}>
                  {playing === slot ? '停止' : '播放 1 秒'}
                </button>
                {OPTIONS.map((name) => (
                  <button key={name} type="button" disabled={revealed}
                    aria-pressed={picks[slot] === name}
                    onClick={() => setPicks((p) => p.map((v, i) => (i === slot ? name : v)))}>
                    {name}
                  </button>
                ))}
                {revealed && !hit ? (
                  <span className="lab-audio-status">正确答案：{clip.answer}</span>
                ) : null}
              </div>
            </div>
          );
        })}
        <div className="lab-audio-row">
          <button type="button" className="lab-audio-button"
            disabled={!answered || revealed || failed} onClick={() => void reveal()}>
            看答案
          </button>
          {revealed ? (
            <button type="button" className="lab-audio-button" onClick={again}>换一组再来</button>
          ) : null}
          <span className="lab-audio-status" aria-live="polite">
            {failed ? '声音素材没能加载，刷新页面可以重试。'
              : revealed ? `三段里你对了 ${correct} 段。`
                : answered ? '三段都选好了，点「看答案」。'
                  : '听完再选，选错也没关系。'}
          </span>
        </div>
      </>
      <>
        {revealed && rate ? (
          <p className="lab-readout">
            {correct === 3 ? '三段全对，你听一遍就分出来了。'
              : correct > 0 ? `你听一遍，分对了 ${correct} 段。`
                : '这一组你一段也没对上——不过你确实听得出这三段不一样。'}
            可是程序拿到的不是声音，是这样一串数字——
            刚才那 1 秒，浏览器把它解码成每秒 <b>{rate}</b> 个数，下面是每段声音刚响起来时挨着的 8 个：
            {order.map((clip, slot) => (
              <span key={clip.file} style={{ display: 'block', marginTop: 6 }}>
                声音 {SLOT[slot]}（{clip.answer}）：
                <b>{(samples[clip.file] ?? []).map(fmt).join('  ')}</b>
              </span>
            ))}
            <span style={{ display: 'block', marginTop: 10 }}>
              这就是程序拿到的全部东西。单独拎出其中任何一个数，你都说不出它来自哪一段；
              你一耳朵听出的区别，散在这几万个数里。
              <b>把它找出来、算成可以互相比较的证据，就是这 23 课要做的事。</b>
              至于这三段为什么听起来不同，第 03 讲再说。
            </span>
          </p>
        ) : (
          <p className="lab-readout">
            三段都只放 1 秒，长短一样，音量也已经拉平——你还是能听出谁是谁。
            先记住这件事，等一下看看程序拿到的是什么。
          </p>
        )}
      </>
    </Lab>
  );
}

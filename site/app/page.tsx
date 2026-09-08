import Image from 'next/image';
import Link from 'next/link';
import { courseOriginalPriceLabel, coursePriceLabel } from '../lib/commerce';

const benefits = [
  {
    index: '01',
    meta: 'SYSTEM COURSES',
    title: '围绕真实目标学习',
    description: '每门课程解决一个完整问题，而不是把零散知识堆成目录。',
    readout: 'CONCEPT / EXPERIMENT / PROJECT',
  },
  {
    index: '02',
    meta: 'INTERACTIVE LABS',
    title: '每个抽象概念都能操作',
    description: '播放声音、拨动参数、观察图形，让公式与真实听感在同一刻发生。',
    readout: 'HEAR / TOUCH / UNDERSTAND',
  },
  {
    index: '03',
    meta: 'LEARNING PATHS',
    title: '看得见知识之间的关系',
    description: '用路线串起基础、方法和项目，知道自己在哪里、下一步学什么。',
    readout: 'FOUNDATION / METHOD / PRACTICE',
  },
  {
    index: '04',
    meta: 'CREATOR NOTES',
    title: '一座持续生长的个人实验室',
    description: '课程、实验和创作记录会持续增加，同时保留个人作者的判断与温度。',
    readout: 'BUILD / TEST / PUBLISH',
  },
];

const domains = [
  {
    index: '01',
    status: '已上线',
    title: '声音与信号',
    description: '从听见声音开始，理解波形、频谱、采样和音频特征。',
    href: '/courses/audio-ml',
    action: '进入音频信号处理课程',
  },
  {
    index: '02',
    status: '筹备中',
    title: '音频机器学习',
    description: '把特征、数据、模型训练和误差分析做成可以亲手运行的项目。',
    href: '/roadmap',
    action: '查看学习路线',
  },
  {
    index: '03',
    status: '持续记录',
    title: '创作者技术与 AI',
    description: '记录内容设计、自动化和 AI 工具怎样变成可靠的创作工作流。',
    href: '/courses',
    action: '浏览内容计划',
  },
];

const labs = [
  {
    index: 'LAB.01',
    lesson: 'CH.02',
    title: '听见频率与振幅',
    description: '转动两个参数，直接比较波形变化与听感。',
    href: '/lesson/02',
    visual: 'wave',
    readoutA: '440 Hz',
    readoutB: '-12.0 dB',
  },
  {
    index: 'LAB.02',
    lesson: 'CH.10',
    title: '频率探针与频谱',
    description: '扫描不同频率，看一个声音怎样被拆开再组合。',
    href: '/lesson/10',
    visual: 'spectrum',
    readoutA: '2048 FFT',
    readoutB: '512 HOP',
    bars: [12, 18, 30, 78, 34, 22, 56, 92, 48, 20, 70, 38, 24, 62, 28, 16],
  },
  {
    index: 'LAB.03',
    lesson: 'CH.20',
    title: '从频谱走到 MFCC',
    description: '观察梅尔滤波与 DCT 如何压缩声音信息。',
    href: '/lesson/20',
    visual: 'spectrogram',
    readoutA: '128 MELS',
    readoutB: '13 MFCC',
  },
];

const phases = [
  {
    phase: 'PHASE 1',
    range: 'CH.01-07',
    title: '认识声音与数字化',
    copy: '建立声音、波形、频率、响度、采样和时域特征的基础直觉。',
    lessons: ['声音与波形', '采样与位深', '音频特征', '分帧与时域分析'],
  },
  {
    phase: 'PHASE 2',
    range: 'CH.08-15',
    title: '理解频率与傅里叶变换',
    copy: '从复数与频率探针出发，理解 DFT、FFT 和短时傅里叶变换。',
    lessons: ['傅里叶直觉', '复数与相位', '离散傅里叶变换', 'STFT'],
  },
  {
    phase: 'PHASE 3',
    range: 'CH.16-23',
    title: '提取可用于模型的特征',
    copy: '把声谱图变成梅尔频谱、MFCC 与可比较的频域统计量。',
    lessons: ['声谱图', '梅尔滤波器组', 'MFCC', '频谱统计特征'],
  },
];

export default function Home() {
  return (
    <div className="instrument-home">
      <main>
        <section className="status-strip" aria-label="课程状态">
          <div className="home-container status-strip-inner">
            <span className="status-ready"><i aria-hidden /> PERSONAL LEARNING LAB ONLINE</span>
            <span>MUSIC TECHNOLOGY · AUDIO ML · CREATOR TOOLS</span>
            <span className="status-edition">CURRENT RELEASE · COURSE 01</span>
          </div>
        </section>

        <section className="instrument-hero">
          <div className="home-container hero-grid">
            <div className="hero-copy">
              <p className="hardware-tag"><span>ETHAN MUSIC LAB</span><i aria-hidden /> INDEPENDENT LEARNING SYSTEM</p>
              <p className="eyebrow">用实验理解技术</p>
              <h1>Ethan<br /><span>音乐实验室</span></h1>
              <h2 className="hero-statement">把声音、音乐与 AI 技术，做成可以亲手理解的课程</h2>
              <p className="hero-description">
                这里收录我持续制作的系统课程、互动实验和学习路线。先从声音出发，逐步走向音频机器学习与创作者技术。
              </p>
              <div className="hero-actions">
                <Link className="btn" href="/courses">浏览所有课程</Link>
                <Link className="btn ghost" href="/labs">体验声音实验</Link>
              </div>
              <div className="hero-proof" aria-label="课程特点">
                <span><i aria-hidden /> 系统课程</span>
                <span><i aria-hidden /> 互动实验</span>
                <span><i aria-hidden /> 持续更新</span>
              </div>
            </div>

            <div className="instrument-showcase">
              <div className="showcase-label">
                <span>INTERACTIVE LEARNING INSTRUMENT</span>
                <span className="live-state"><i aria-hidden /> LIVE</span>
              </div>
              <div className="synth-frame">
                <Image
                  src="/hero-synth.jpg"
                  alt="灰白色桌面教学合成器，透明上盖下显示波形与控制旋钮"
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
                <div className="synth-readout"><i aria-hidden /> LEARNING SYSTEM ACTIVE · EML LAB</div>
              </div>
              <div className="device-specs">
                <span><small>LEARNING MODE</small><b>READ / HEAR / TEST</b></span>
                <span><small>COURSE ONLINE</small><b>AUDIO SIGNAL 01</b></span>
                <span><small>LAB STATUS</small><b>8 MODULES READY</b></span>
              </div>
            </div>
          </div>
        </section>

        <section className="benefit-band" aria-label="课程优势">
          <div className="home-container benefit-grid">
            {benefits.map((item) => (
              <article className="benefit-module" key={item.index}>
                <div className="module-meta"><span>[ {item.index} ]</span><span>{item.meta}</span></div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <small>{item.readout}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section learning-domains">
          <div className="home-container">
            <header className="home-section-heading">
              <div>
                <p className="eyebrow">LEARNING DOMAINS</p>
                <h2>不止一门课，而是一张持续展开的学习地图</h2>
                <p>从声音技术开始，逐步延伸到音频机器学习和个人创作工具。</p>
              </div>
              <Link className="section-link" href="/courses">查看全部方向</Link>
            </header>
            <div className="domain-grid">
              {domains.map((domain) => (
                <Link className="domain-module" href={domain.href} key={domain.index}>
                  <div className="domain-index">{domain.index}</div>
                  <div className="module-meta"><span>{domain.status}</span><span>LEARNING FIELD</span></div>
                  <h3>{domain.title}</h3>
                  <p>{domain.description}</p>
                  <b>{domain.action}</b>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section lab-preview" id="lab-preview">
          <div className="home-container">
            <header className="home-section-heading">
              <div>
                <p className="eyebrow">INTERACTIVE FIRST · 8 LABS</p>
                <h2>第一批开放的声音实验</h2>
                <p>跟随当前课程，亲手“切碎”与“重组”声音，不把理解停在公式上。</p>
              </div>
              <Link className="section-link" href="/labs">查看全部实验</Link>
            </header>
            <div className="lab-preview-grid">
              {labs.map((lab) => (
                <Link className="lab-module" href={lab.href} key={lab.index}>
                  <div className="module-meta"><span>{lab.index}</span><span>{lab.lesson}</span></div>
                  <div className={`scope-screen scope-${lab.visual}`} aria-hidden>
                    <div className="scope-toolbar">
                      <span>INPUT A · 48.0 kHz</span>
                      <b><i /> LIVE</b>
                    </div>
                    <div className="scope-viewport">
                      {lab.visual === 'wave' ? (
                        <svg viewBox="0 0 360 150" preserveAspectRatio="none">
                          <path className="scope-axis" d="M0 75H360 M90 0V150 M180 0V150 M270 0V150" />
                          <path className="scope-wave-a" d="M0 75 C15 18 30 18 45 75 S75 132 90 75 S120 18 135 75 S165 132 180 75 S210 18 225 75 S255 132 270 75 S300 18 315 75 S345 132 360 75" />
                          <path className="scope-wave-b" d="M0 104 C22 104 22 46 45 46 S68 104 90 104 S113 46 135 46 S158 104 180 104 S203 46 225 46 S248 104 270 104 S293 46 315 46 S338 104 360 104" />
                        </svg>
                      ) : null}
                      {lab.visual === 'spectrum' ? (
                        <div className="scope-spectrum-bars">
                          {lab.bars?.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
                        </div>
                      ) : null}
                      {lab.visual === 'spectrogram' ? (
                        <div className="scope-spectrogram-grid">
                          {Array.from({ length: 72 }, (_, index) => (
                            <i key={index} style={{ opacity: .12 + ((index * 17 + Math.floor(index / 12) * 11) % 84) / 100 }} />
                          ))}
                        </div>
                      ) : null}
                      <span className="scope-y-top">0 dB</span>
                      <span className="scope-y-bottom">-96</span>
                      <span className="scope-x-left">0</span>
                      <span className="scope-x-right">24 kHz</span>
                    </div>
                    <div className="scope-footer"><span>TRIGGER · AUTO</span><span>SYNC · INTERNAL</span><b>STABLE</b></div>
                  </div>
                  <div className="scope-controls" aria-hidden>
                    <span><small>PARAM A</small><b>{lab.readoutA}</b></span>
                    <i className="scope-knob"><u /></i>
                    <span><small>PARAM B</small><b>{lab.readoutB}</b></span>
                    <span className="scope-switch"><i /></span>
                  </div>
                  <h3>{lab.title}</h3>
                  <p>{lab.description}</p>
                  <b>打开实验</b>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section curriculum" id="curriculum">
          <div className="home-container">
            <header className="home-section-heading curriculum-heading">
              <div>
                <p className="eyebrow">CURRICULUM · 23 LESSONS</p>
                <h2>当前主课：音频信号处理二十三讲</h2>
                <p>实验室的第一门完整课程，从物理直觉一路走到音频特征。</p>
              </div>
              <div className="price-module"><strong>{coursePriceLabel()}</strong><span>当前价 · 单次购买</span><del>原价 {courseOriginalPriceLabel()}</del><Link href="/pricing">查看完整版</Link></div>
            </header>
            <div className="phase-grid">
              {phases.map((item) => (
                <article className="phase-module" key={item.phase}>
                  <div className="module-meta"><span>{item.phase}</span><span>{item.range}</span></div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <ol>{item.lessons.map((lesson, index) => <li key={lesson}><span>{String(index + 1).padStart(2, '0')}</span>{lesson}</li>)}</ol>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section author-section">
          <div className="home-container author-panel">
            <div className="author-id" aria-hidden>
              <span>EML</span>
              <small>CREATOR / EDUCATOR</small>
            </div>
            <div className="author-copy">
              <p className="eyebrow">CREATOR NOTE</p>
              <h2>把难懂的技术，做成可以亲手验证的东西</h2>
              <p>我是 Ethan。这里不仅保存一门音频课，也会持续收录我对音乐技术、音频机器学习、交互教学和创作者工具的研究。每个主题都会尽量把直觉、实验、代码和图形重新对齐。</p>
              <Link className="section-link" href="/courses">浏览实验室内容</Link>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="home-container final-cta-inner">
            <div><p className="eyebrow">START FROM COURSE 01</p><h2>从实验室的第一门课程开始</h2><p>《音频信号处理二十三讲》前三讲完整开放，先真实体验讲解和实验。</p></div>
            <div className="hero-actions"><Link className="btn" href="/lesson/01">免费学习第 01 讲</Link><Link className="btn ghost inverse" href="/courses">浏览全部方向</Link></div>
          </div>
        </section>
      </main>
    </div>
  );
}

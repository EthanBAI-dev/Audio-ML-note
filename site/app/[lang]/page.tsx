import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getT, pageMetadata } from '../../lib/locale';

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('/');
}

/** 文字都在词典的 home 里，这里只放图标、链接这些和语言无关的部分，顺序和词典里的数组一一对应。 */
const BENEFIT_ICONS = ['listen', 'slider', 'steps', 'chat'] as const;

const DOMAINS = [
  { icon: 'wave', live: true, href: '/courses/audio-ml' },
  { icon: 'model', live: false, href: '/roadmap' },
  { icon: 'pen', live: false, href: '/courses' },
] as const;

type IconName = (typeof BENEFIT_ICONS)[number] | (typeof DOMAINS)[number]['icon'];

function LineIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {name === 'listen' ? <path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1z" /> : null}
      {name === 'slider' ? <path d="M4 7h16M4 17h16M9 4v6M15 14v6" /> : null}
      {name === 'steps' ? <path d="M4 20h5v-5h5v-5h6V4" /> : null}
      {name === 'chat' ? <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /> : null}
      {name === 'wave' ? <path d="M2 12h3l2-6 3 12 3-9 2 6 2-3h5" /> : null}
      {name === 'model' ? <path d="M6 6h12v12H6zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z" /> : null}
      {name === 'pen' ? <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" /> : null}
    </svg>
  );
}

const LABS = [
  {
    index: 'LAB.01',
    lesson: 'CH.02',
    href: '/lesson/02',
    visual: 'wave',
    readoutA: '440 Hz',
    readoutB: '-12.0 dB',
  },
  {
    index: 'LAB.02',
    lesson: 'CH.10',
    href: '/lesson/10',
    visual: 'spectrum',
    readoutA: '2048 FFT',
    readoutB: '512 HOP',
    bars: [12, 18, 30, 78, 34, 22, 56, 92, 48, 20, 70, 38, 24, 62, 28, 16],
  },
  {
    index: 'LAB.03',
    lesson: 'CH.20',
    href: '/lesson/20',
    visual: 'spectrogram',
    readoutA: '128 MELS',
    readoutB: '13 MFCC',
  },
];

const PHASES = [
  { phase: 'PHASE 1', range: 'CH.01-07' },
  { phase: 'PHASE 2', range: 'CH.08-15' },
  { phase: 'PHASE 3', range: 'CH.16-23' },
];

export default async function Home() {
  const { t: dict, to } = await getT();
  const t = dict.home;
  return (
    <div className="instrument-home">
      <main>
        <section className="status-strip" aria-label={t.statusAria}>
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
              <p className="eyebrow">{t.eyebrow}</p>
              <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
              <h2 className="hero-statement">{t.statement}</h2>
              <p className="hero-description">{t.description}</p>
              <div className="hero-actions">
                <Link className="btn" href={to('/courses')}>{t.ctaBrowse}</Link>
                <Link className="btn ghost" href={to('/labs')}>{t.ctaLabs}</Link>
              </div>
              <div className="hero-proof" aria-label={t.proofAria}>
                {t.proof.map((label) => <span key={label}><i aria-hidden /> {label}</span>)}
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
                  alt={t.heroAlt}
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

        <section className="benefit-band" aria-label={t.benefitsAria}>
          <div className="home-container benefit-grid">
            {t.benefits.map((item, i) => (
              <article className="benefit-module" key={BENEFIT_ICONS[i]}>
                <span className="benefit-icon"><LineIcon name={BENEFIT_ICONS[i]} /></span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section learning-domains">
          <div className="home-container">
            <header className="home-section-heading">
              <div>
                <h2>{t.domainsTitle}</h2>
                <p>{t.domainsLead}</p>
              </div>
              <Link className="section-link" href={to('/courses')}>{t.domainsAll}</Link>
            </header>
            <div className="domain-grid">
              {DOMAINS.map((domain, i) => (
                <Link className="domain-module" href={to(domain.href)} key={domain.icon}>
                  <div className="domain-top">
                    <span className="benefit-icon"><LineIcon name={domain.icon} /></span>
                    <span className={domain.live ? 'domain-status is-live' : 'domain-status'}>{t.domains[i].status}</span>
                  </div>
                  <h3>{t.domains[i].title}</h3>
                  <p>{t.domains[i].description}</p>
                  <b>{t.domains[i].action} →</b>
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
                <h2>{t.labsTitle}</h2>
                <p>{t.labsLead}</p>
              </div>
              <Link className="section-link" href={to('/labs')}>{t.labsAll}</Link>
            </header>
            <div className="lab-preview-grid">
              {LABS.map((lab, i) => (
                <Link className="lab-module" href={to(lab.href)} key={lab.index}>
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
                  <h3>{t.labs[i].title}</h3>
                  <p>{t.labs[i].description}</p>
                  <b>{t.openLab}</b>
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
                <h2>{t.curriculumTitle}</h2>
                <p>{t.curriculumLead}</p>
              </div>
            </header>
            <div className="phase-grid">
              {PHASES.map((item, i) => (
                <article className="phase-module" key={item.phase}>
                  <div className="module-meta"><span>{item.phase}</span><span>{item.range}</span></div>
                  <h3>{t.phases[i].title}</h3>
                  <p>{t.phases[i].copy}</p>
                  <ol>{t.phases[i].lessons.map((lesson, index) => <li key={lesson}><span>{String(index + 1).padStart(2, '0')}</span>{lesson}</li>)}</ol>
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
              <h2>{t.authorTitle}</h2>
              <p>{t.authorBody}</p>
              <Link className="section-link" href={to('/courses')}>{t.ctaBrowse}</Link>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="home-container final-cta-inner">
            <div><p className="eyebrow">START FROM COURSE 01</p><h2>{t.finalTitle}</h2><p>{t.finalBody}</p></div>
            <div className="hero-actions"><Link className="btn" href={to('/lesson/01')}>{dict.course.startLesson1}</Link><Link className="btn ghost inverse" href={to('/courses')}>{t.ctaBrowse}</Link></div>
          </div>
        </section>
      </main>
    </div>
  );
}

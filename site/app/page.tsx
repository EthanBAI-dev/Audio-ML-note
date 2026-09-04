import Link from 'next/link';
import { groups } from '../lib/lessons';
import { WIDGETS } from '../content/widgets';

export default function Home() {
  const gs = groups();
  return (
    <div className="shell home">
      <main>
        <section className="hero">
          <p className="eyebrow">AUDIO SIGNAL PROCESSING · 23 讲</p>
          <h1>从「声音是什么」讲到 MFCC</h1>
          <p className="hero-lead">
            面向没有任何相关背景的读者。全程围绕一个项目：
            <b>让程序听 1 秒钟的音乐片段，判断它来自古典、爵士还是摇滚。</b>
          </p>
          <p className="hero-stats">
            <span><b>23</b> 讲</span><span><b>122</b> 张配图</span>
            <span><b>7</b> 个交互实验</span><span><b>23</b> 个可运行脚本</span>
          </p>
          <p className="hero-cta">
            <Link href="/lesson/01" className="btn">从第 01 讲开始</Link>
          </p>
        </section>

        <section className="course-docs" aria-labelledby="course-docs-title">
          <div className="course-docs-head">
            <p className="eyebrow">开始之前</p>
            <h2 id="course-docs-title">先看全貌，再进入 23 讲</h2>
          </div>
          <div className="course-docs-grid">
            <Link href="/guide" className="course-doc">
              <span className="course-doc-kicker">学习地图</span>
              <strong>课程总纲</strong>
              <span>了解课程边界、共同基础和四条特征路线。</span>
              <i aria-hidden>阅读总纲 →</i>
            </Link>
            <Link href="/project" className="course-doc">
              <span className="course-doc-kicker">实践路线</span>
              <strong>三首曲子，一个分类器</strong>
              <span>查看最终产物，以及 23 个实验怎样连成一个项目。</span>
              <i aria-hidden>查看项目 →</i>
            </Link>
          </div>
        </section>

        {gs.map((g) => (
          <section key={g.group} className="group" id={`g${g.group}`}>
            <h2><span className="group-range">{g.group.replace('-', '—')}</span>{g.title}</h2>
            <ul className="lesson-list">
              {g.lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/lesson/${l.id}`}>
                    <span className="lesson-n">{l.id}</span>
                    <span className="lesson-body">
                      <span className="lesson-title">
                        {l.title}
                        {(WIDGETS[l.id] ?? []).length ? <i className="dot" title="含交互实验" /> : null}
                      </span>
                      <span className="lesson-lead"><span>{l.lead}</span></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

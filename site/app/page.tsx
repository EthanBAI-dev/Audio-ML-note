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
            <Link href="/guide" className="btn ghost">先看课程总纲</Link>
          </p>
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
                      <span className="lesson-lead">{l.lead}</span>
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

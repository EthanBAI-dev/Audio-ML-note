import Link from 'next/link';
import { groups } from '../lib/lessons';

export default function Home() {
  const gs = groups();
  return (
    <div className="home">
      <section className="hero">
        <h1>音频信号处理二十三讲</h1>
        <p className="hero-lead">
          面向没有任何相关背景的读者，从「电脑怎样看见声音」讲到梅尔频谱、MFCC 和频域统计特征。
          全程围绕一个项目：<b>让程序听 1 秒钟的音乐片段，判断它来自古典、爵士还是摇滚。</b>
        </p>
        <p className="hero-note">
          带 <span className="chip">交互</span> 标记的课可以直接在网页上调参数、看图跟着变。
        </p>
      </section>
      {gs.map((g) => (
        <section key={g.group} className="group">
          <h2><span className="group-range">第 {g.group.replace('-', '—')} 课</span> {g.title}</h2>
          <ul className="lesson-list">
            {g.lessons.map((l) => (
              <li key={l.id}>
                <Link href={`/lesson/${l.id}`}>
                  <span className="lesson-n">{l.id}</span>
                  <span className="lesson-body">
                    <span className="lesson-title">{l.title}</span>
                    <span className="lesson-lead">{l.lead}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

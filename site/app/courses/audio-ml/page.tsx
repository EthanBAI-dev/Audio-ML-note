import type { Metadata } from 'next';
import Link from 'next/link';
import { groups } from '../../../lib/lessons';
import { WIDGETS } from '../../../content/widgets';
import { hasCourseAccess } from '../../../lib/access';
import { courseOriginalPriceLabel, coursePriceLabel, isPublicLesson } from '../../../lib/commerce';

export const metadata: Metadata = {
  title: '音频信号处理二十三讲',
  description: '从声音与波形讲到梅尔频谱、MFCC 与频域统计特征的零基础中文课程。',
};

export default async function AudioCoursePage() {
  const gs = groups();
  const unlocked = await hasCourseAccess();
  return <div className="shell home course-detail"><main>
    <section className="hero">
      <p className="eyebrow">COURSE 01 · AUDIO SIGNAL PROCESSING</p>
      <h1>从「声音是什么」讲到 MFCC</h1>
      <p className="hero-lead">面向没有任何相关背景的读者。全程围绕一个项目：<b>让程序听 1 秒钟的音乐片段，判断它来自古典、爵士还是摇滚。</b></p>
      <p className="hero-stats"><span><b>23</b> 讲</span><span><b>247</b> 张配图</span><span><b>8</b> 种交互实验</span><span><b>23</b> 个可运行脚本</span></p>
      <p className="hero-cta"><Link href="/lesson/01" className="btn">从第 01 讲开始</Link><Link href="/pricing" className="btn ghost"><del>{courseOriginalPriceLabel()}</del> {coursePriceLabel()} 解锁完整版</Link></p>
    </section>
    <section className="group group-intro" aria-labelledby="course-docs-title"><h2 id="course-docs-title"><span className="group-range">00</span>开始之前</h2><ul className="lesson-list"><li><Link href="/guide"><span className="lesson-n">导览</span><span className="lesson-body"><span className="lesson-title">课程总纲</span><span className="lesson-lead"><span>一次看清课程边界、运行环境和 23 讲的完整学习顺序。</span></span></span></Link></li></ul></section>
    {gs.map((g) => <section key={g.group} className="group" id={`g${g.group}`}><h2><span className="group-range">{g.group.replace('-', '—')}</span>{g.title}</h2><ul className="lesson-list">{g.lessons.map((l) => <li key={l.id}><Link href={`/lesson/${l.id}`}><span className="lesson-n">{l.id}</span><span className="lesson-body"><span className="lesson-title">{l.title}{(WIDGETS[l.id] ?? []).length ? <i className="dot" title="含交互实验" /> : null}<small className={`access-mark ${isPublicLesson(l.id) || unlocked ? 'is-open' : ''}`}>{isPublicLesson(l.id) ? '免费' : unlocked ? '已解锁' : '完整版'}</small></span><span className="lesson-lead"><span>{l.lead}</span></span></span></Link></li>)}</ul></section>)}
  </main></div>;
}

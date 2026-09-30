import type { Metadata } from 'next';
import Link from 'next/link';
import { groups } from '../../../../lib/lessons';
import { WIDGETS } from '../../../../content/widgets';
import { getT, pageMetadata } from '../../../../lib/locale';
import { rich } from '../../../../lib/rich';
import { lessonText } from '../../../../lib/dictionaries/lessons';
import CourseCredit from '../../../../components/CourseCredit';
import ChineseOnly from '../../../../components/ChineseOnly';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/courses/audio-ml', { title: t.course.name, description: t.audioCourse.metaDescription });
}

export default async function AudioCoursePage() {
  const { lang, t: dict, to } = await getT();
  const t = dict.audioCourse;
  const gs = groups();
  return <div className="shell home course-detail"><main>
    <section className="hero">
      <p className="eyebrow">COURSE 01 · AUDIO SIGNAL PROCESSING</p>
      <h1>{t.title}</h1>
      <p className="hero-lead">{rich(t.lead, { project: <b>{t.project}</b> })}</p>
      <p className="hero-stats"><span><b>23</b> {t.stats.lessons}</span><span><b>247</b> {t.stats.figures}</span><span><b>8</b> {t.stats.labs}</span><span><b>23</b> {t.stats.scripts}</span></p>
      <p className="hero-cta"><Link href={to('/lesson/01')} className="btn">{dict.course.startLesson1}</Link><Link href={to('/guide')} className="btn ghost">{t.seeGuide}</Link></p>
    </section>
    <ChineseOnly />
    <section className="group group-intro" aria-labelledby="course-docs-title"><h2 id="course-docs-title"><span className="group-range">00</span>{t.beforeStart}</h2><ul className="lesson-list"><li><Link href={to('/guide')}><span className="lesson-n">{t.guideTag}</span><span className="lesson-body"><span className="lesson-title">{t.guideTitle}</span><span className="lesson-lead"><span>{t.guideLead}</span></span></span></Link></li></ul></section>
    {gs.map((g) => <section key={g.group} className="group" id={`g${g.group}`}><h2><span className="group-range">{g.group.replace('-', '—')}</span>{dict.course.groups[g.group] ?? g.title}</h2><ul className="lesson-list">{g.lessons.map((l) => { const text = lessonText(lang, l); return <li key={l.id}><Link href={to(`/lesson/${l.id}`)}><span className="lesson-n">{l.id}</span><span className="lesson-body"><span className="lesson-title" lang={text.lang}>{text.title}{(WIDGETS[l.id] ?? []).length ? <i className="dot" title={dict.course.hasLab} /> : null}</span><span className="lesson-lead" lang={text.lang}><span>{text.lead}</span></span></span></Link></li>; })}</ul></section>)}
    <CourseCredit />
  </main></div>;
}

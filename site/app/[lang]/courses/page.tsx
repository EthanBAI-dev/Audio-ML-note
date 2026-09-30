import type { Metadata } from 'next';
import Link from 'next/link';
import { getT, pageMetadata } from '../../../lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/courses', { title: t.courses.title, description: t.courses.metaDescription });
}

export default async function CoursesPage() {
  const { t: dict, to } = await getT();
  const t = dict.courses;
  return <div className="shell home directory-shell"><main>
    <header className="directory-hero"><p className="eyebrow">LAB CONTENTS</p><h1>{t.title}</h1><p>{t.lead}</p></header>
    <section className="course-catalog">
      <article className="course-product is-live">
        <div className="course-cover"><span>01</span><div className="mini-wave">⌁⌁⌁⌁⌁</div></div>
        <div className="course-copy"><p className="eyebrow">{t.published}</p><h2>{dict.course.name}</h2><p>{t.course1}</p>
          <ul>{t.course1Points.map((point) => <li key={point}>{point}</li>)}</ul>
          <p className="hero-cta"><Link className="btn" href={to('/courses/audio-ml')}>{t.viewCourse}</Link><Link className="btn ghost" href={to('/lesson/01')}>{dict.course.startLesson1}</Link></p>
        </div>
      </article>
      <article className="course-product is-planned"><div className="course-cover"><span>02</span></div><div className="course-copy"><p className="eyebrow">{t.planned}</p><h2>{t.course2Title}</h2><p>{t.course2}</p></div></article>
      <article className="course-product is-planned"><div className="course-cover"><span>03</span></div><div className="course-copy"><p className="eyebrow">{t.plan}</p><h2>{t.course3Title}</h2><p>{t.course3}</p></div></article>
    </section>
  </main></div>;
}

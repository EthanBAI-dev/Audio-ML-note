import type { Metadata } from 'next';
import Link from 'next/link';
import { lessonById } from '../../../lib/lessons';
import { getT, pageMetadata } from '../../../lib/locale';
import { lessonText } from '../../../lib/dictionaries/lessons';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/labs', { title: t.labsPage.title, description: t.labsPage.metaDescription });
}

/** 有实验的课号，按课程顺序排。实验名和说明在词典的 labsPage.items 里。 */
const LAB_LESSONS = ['02', '06', '10', '11', '15', '20', '21'];

export default async function LabsPage() {
  const { lang, t: dict, to } = await getT();
  const t = dict.labsPage;
  return <div className="shell home directory-shell"><main>
    <header className="directory-hero"><p className="eyebrow">INTERACTIVE LABS</p><h1>{t.title}</h1><p>{t.lead}</p></header>
    <div className="lab-directory">{LAB_LESSONS.map((id) => {
      const [title, description] = t.items[id];
      const lesson = lessonById(id);
      const text = lesson && lessonText(lang, lesson);
      return <Link href={to(`/lesson/${id}`)} key={id}><span>{id}</span><div><h2>{title}</h2><p>{description}</p><small>{t.inLesson}<span lang={text?.lang}>{text?.title}</span></small></div><b>{t.open}</b></Link>;
    })}</div>
  </main></div>;
}

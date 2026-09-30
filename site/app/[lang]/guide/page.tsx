import type { Metadata } from 'next';
import Link from 'next/link';
import { readDoc } from '../../../lib/lessons';
import { renderLesson } from '../../../lib/markdown';
import { extractToc } from '../../../lib/toc';
import { getT, pageMetadata } from '../../../lib/locale';
import { localizeLinks } from '../../../lib/i18n';
import Article from '../../../components/Article';
import Toc from '../../../components/Toc';
import CourseCredit from '../../../components/CourseCredit';
import ChineseOnly from '../../../components/ChineseOnly';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/guide', { title: t.guidePage.title });
}

export default async function Page() {
  const { lang, t, to } = await getT();
  const doc = readDoc('课程总纲');
  const html = localizeLinks(lang, await renderLesson(doc.body, { group: 'guide' } as never));
  return (
    <div className="shell">
      <Toc items={extractToc(html)} labels={{ aria: t.ui.tocAria, title: t.ui.tocTitle, collapse: t.ui.collapse, expand: t.ui.expand }} />
      <main>
        <nav className="crumb" aria-label={t.ui.breadcrumb}>
          <Link href={to('/courses/audio-ml')}>{t.course.short}</Link><span aria-hidden>/</span>
          <span aria-current="page">{t.guidePage.title}</span>
        </nav>
        <ChineseOnly />
        <article lang="zh-CN">
          <header className="art-head">
            <h1>{doc.title}</h1>
            {doc.lead ? <p className="lead">{doc.lead}</p> : null}
          </header>
          <Article html={html} />
        </article>
        <CourseCredit />
      </main>
    </div>
  );
}

import Link from 'next/link';
import { readDoc } from '../../lib/lessons';
import { renderLesson } from '../../lib/markdown';
import { extractToc } from '../../lib/toc';
import Article from '../../components/Article';
import Toc from '../../components/Toc';

export const metadata = { title: '课程导览' };

export default async function Page() {
  const doc = readDoc('课程总纲');
  const html = await renderLesson(doc.body, { group: 'guide' } as never);
  return (
    <div className="shell">
      <Toc items={extractToc(html)} />
      <main>
        <nav className="crumb" aria-label="面包屑">
          <Link href="/">全部课程</Link><span aria-hidden>/</span>
          <span aria-current="page">课程导览</span>
        </nav>
        <article>
          <header className="art-head">
            <h1>{doc.title}</h1>
            {doc.lead ? <p className="lead">{doc.lead}</p> : null}
          </header>
          <Article html={html} />
        </article>
      </main>
    </div>
  );
}

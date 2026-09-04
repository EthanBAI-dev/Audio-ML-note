import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { COURSE } from '../../lib/lessons';
import { renderLesson } from '../../lib/markdown';
import { extractToc } from '../../lib/toc';
import Article from '../../components/Article';
import Toc from '../../components/Toc';

export const metadata = { title: '课程总纲' };

export default async function Page() {
  const raw = readFileSync(join(COURSE, '课程总纲', 'README.md'), 'utf8');
  const html = await renderLesson(raw.replace(/^#\s+.+$/m, ''), { group: '01-05' } as never);
  return (
    <div className="shell">
      <Toc items={extractToc(html)} />
      <main>
        <nav className="crumb" aria-label="面包屑">
          <Link href="/">全部课程</Link><span aria-hidden>/</span>
          <span aria-current="page">课程总纲</span>
        </nav>
        <article>
          <header className="art-head"><h1>课程总纲</h1></header>
          <Article html={html} />
        </article>
      </main>
    </div>
  );
}

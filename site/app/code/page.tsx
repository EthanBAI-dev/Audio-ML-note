import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readDoc } from '../../lib/lessons';
import { renderLesson } from '../../lib/markdown';
import { extractToc } from '../../lib/toc';
import { codeAvailable, codeFiles, lessonOf } from '../../lib/code';
import Article from '../../components/Article';
import Toc from '../../components/Toc';

export const metadata = { title: '课程代码' };

export default async function Page() {
  if (!codeAvailable()) notFound();
  const doc = readDoc('课程代码');
  const html = await renderLesson(doc.body, { group: 'code' } as never);
  const files = codeFiles();
  const lessons = files.filter((f) => f.dir === 'lessons');
  const toolkit = files.filter((f) => f.dir === 'soundlab');

  return (
    <div className="shell">
      <Toc items={extractToc(html)} />
      <main>
        <nav className="crumb" aria-label="面包屑">
          <Link href="/courses">全部课程</Link><span aria-hidden>/</span>
          <span aria-current="page">课程代码</span>
        </nav>
        <article>
          <header className="art-head">
            <h1>{doc.title}</h1>
            {doc.lead ? <p className="lead">{doc.lead}</p> : null}
          </header>
          <Article html={html} />

          <div className="prose">
            <h2 id="每课一个脚本">每课一个脚本</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>脚本</th><th>对应</th></tr></thead>
                <tbody>
                  {lessons.map((f) => {
                    const n = lessonOf(f.name);
                    return (
                      <tr key={f.path}>
                        <td><Link href={`/code/${f.path}`}>{f.name}</Link></td>
                        <td>{n ? <Link href={`/lesson/${n}`}>第 {n} 讲</Link> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h2 id="工具包">工具包 soundlab</h2>
            <p>正文里写过的函数最后都收在这里，一课加一点。</p>
            <ul>
              {toolkit.map((f) => (
                <li key={f.path}><Link href={`/code/${f.path}`}>{f.name}</Link></li>
              ))}
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}

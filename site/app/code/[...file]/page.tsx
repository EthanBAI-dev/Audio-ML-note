import Link from 'next/link';
import { notFound } from 'next/navigation';
import { codeFiles, lessonOf, readCodeFile } from '../../../lib/code';

export function generateStaticParams() {
  return codeFiles().map((f) => ({ file: f.path.split('/') }));
}

export async function generateMetadata({ params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const found = readCodeFile(file);
  return found ? { title: found.path } : {};
}

export default async function Page({ params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const found = readCodeFile(file);
  if (!found) notFound();
  const name = found.path.split('/').pop() ?? found.path;
  const n = lessonOf(name);
  const lines = found.text.replace(/\n+$/, '').split('\n').length;

  return (
    // 这一页没有侧边目录，用单列版式，否则 .shell 的两栏栅格会把正文挤成窄柱
    <div className="shell home">
      <main>
        <nav className="crumb" aria-label="面包屑">
          <Link href="/courses">全部课程</Link><span aria-hidden>/</span>
          <Link href="/code">课程代码</Link><span aria-hidden>/</span>
          <span aria-current="page">{name}</span>
        </nav>
        <article>
          <header className="art-head">
            <p className="art-meta">
              <span className="art-n">{found.path}</span>
              <span>{lines} 行</span>
              {n ? <span className="art-chip">第 {n} 讲</span> : null}
            </p>
            <h1>{name}</h1>
            <p className="lead">
              这是课程代码里的原文件。
              {n ? <> 它跑出来的数字，就是<Link href={`/lesson/${n}`}>第 {n} 讲</Link>正文里引用的那些。</> : null}
            </p>
          </header>
          <div className="prose">
            <pre><code>{found.text}</code></pre>
          </div>
        </article>
      </main>
    </div>
  );
}

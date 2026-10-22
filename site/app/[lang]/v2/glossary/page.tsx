import type { Metadata } from 'next';
import Link from 'next/link';
import { v2Glossary } from '../../../../lib/lessons';
import { getT, pageMetadata } from '../../../../lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('/v2/glossary', { title: '术语表（v2）', description: '课程里出现的专业词，中英对照，一句话解释。' });
}

/** v2 术语表：从各课「本课术语」汇总，每个词只列一次。 */
export default async function GlossaryPage() {
  const { to } = await getT();
  const terms = v2Glossary();
  return (
    <div className="shell home directory-shell"><main>
      <header className="directory-hero">
        <p className="eyebrow">GLOSSARY · v2</p>
        <h1>术语表</h1>
        <p>课程里出现的专业词，中英对照，一句话解释。v2 试行中，目前收录已改版课文里的 {terms.length} 个词，后续逐课补齐。</p>
      </header>
      <div className="table-wrap prose"><table>
        <thead><tr><th>中文</th><th>英文</th><th>一句话解释</th><th>首次出现</th><th>收录于</th></tr></thead>
        <tbody>{terms.map((g) => (
          <tr key={g.zh}><td><b>{g.zh}</b></td><td>{g.en}</td><td>{g.desc.replace(/\$([^$]+)\$/g, '$1').replace(/-/g, '−')}</td><td>{g.first}</td>
            <td><Link href={to(`/v2/lesson/${g.lesson}`)}>第 {g.lesson} 课 v2</Link></td></tr>
        ))}</tbody>
      </table></div>
    </main></div>
  );
}

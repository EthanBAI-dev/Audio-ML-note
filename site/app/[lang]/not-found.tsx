import Link from 'next/link';
import { getT } from '../../lib/locale';

export default async function NotFound() {
  const { t, to } = await getT();
  return (
    <div className="shell">
      <main>
        <article className="notfound">
          <p className="eyebrow">404</p>
          <h1>{t.notFound.title}</h1>
          <p>{t.notFound.body}</p>
          <p><Link href={to('/courses')} className="btn">{t.notFound.back}</Link></p>
        </article>
      </main>
    </div>
  );
}

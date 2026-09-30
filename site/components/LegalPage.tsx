import Link from 'next/link';
import { getT } from '../lib/locale';
import { rich } from '../lib/rich';

const EMAIL = 'hello@ethanmusiclab.com';

/** 服务条款、隐私说明、版权许可三页共用的排版。文字在词典的 legal 里。 */
export default async function LegalPage({ doc }: { doc: 'terms' | 'privacy' | 'licenses' }) {
  const { t, to } = await getT();
  const page = t.legal[doc];
  const parts = {
    email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>,
    licenses: <Link href={to('/legal/licenses')}>{t.legal.terms.licensesLink}</Link>,
  };
  return (
    <div className="shell home legal-shell"><main><article>
      <h1>{page.title}</h1>
      <p className="legal-updated">{page.updated}</p>
      {t.legal.translationNote ? <p className="lang-note" role="note">{t.legal.translationNote}</p> : null}
      {page.sections.map((section) => (
        <section key={section.h}>
          <h2>{section.h}</h2>
          {section.p.map((text) => <p key={text}>{rich(text, parts)}</p>)}
        </section>
      ))}
    </article></main></div>
  );
}

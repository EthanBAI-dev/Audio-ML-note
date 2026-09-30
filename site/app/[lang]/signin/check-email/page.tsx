import type { Metadata } from 'next';
import Link from 'next/link';
import { getT } from '../../../../lib/locale';
import { rich } from '../../../../lib/rich';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.checkEmail.title };
}

export default async function CheckEmailPage() {
  const { t: { checkEmail: t }, to } = await getT();
  return (
    <div className="shell home account-shell"><main><section className="auth-card">
      <p className="eyebrow">CHECK YOUR INBOX</p>
      <h1>{t.heading}</h1>
      <p>{t.body}</p>
      <p className="auth-note">{rich(t.note, { resend: <Link href={to('/signin')}>{t.resend}</Link> })}</p>
    </section></main></div>
  );
}

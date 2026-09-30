import type { Metadata } from 'next';
import { getT, pageMetadata } from '../../../../lib/locale';
import LegalPage from '../../../../components/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/legal/terms', { title: t.legal.terms.title });
}

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}

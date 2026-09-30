import type { Metadata } from 'next';
import { getT, pageMetadata } from '../../../../lib/locale';
import LegalPage from '../../../../components/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/legal/privacy', { title: t.legal.privacy.title });
}

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}

import type { Metadata } from 'next';
import { getT, pageMetadata } from '../../../../lib/locale';
import LegalPage from '../../../../components/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/legal/licenses', { title: t.legal.licenses.title });
}

export default function LicensesPage() {
  return <LegalPage doc="licenses" />;
}

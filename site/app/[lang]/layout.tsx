import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import '../globals.css';
import Lightbox from '../../components/Lightbox';
import SiteNav from '../../components/SiteNav';
import BackToTop from '../../components/BackToTop';
import ViewTracker from '../../components/ViewTracker';
import { HTML_LANG, LOCALES } from '../../lib/i18n';
import { getT } from '../../lib/locale';

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t.meta.siteName, template: `%s · ${t.meta.siteName}` },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t, to } = await getT();
  return (
    <html lang={HTML_LANG[lang]}>
      <body>
        <SiteNav t={t.nav} guide={t.signinGuide} siteName={t.meta.siteName} />
        {children}
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand">
              <p className="foot-title">{t.meta.siteName}</p>
              <p>{t.footer.tagline}</p>
            </div>
            <div className="foot-cols">
              <div>
                <p className="foot-h">{t.footer.contents}</p>
                <ul>
                  <li><Link href={to('/courses/audio-ml')}>{t.course.name}</Link></li>
                  <li><Link href={to('/labs')}>{t.footer.labs}</Link></li>
                  <li><Link href={to('/roadmap')}>{t.footer.roadmap}</Link></li>
                  <li><Link href={to('/courses')}>{t.footer.all}</Link></li>
                </ul>
              </div>
              <div>
                <p className="foot-h">{t.footer.related}</p>
                <ul>
                  <li><Link href={to('/signin')}>{t.footer.signin}</Link></li>
                  <li><Link href={to('/legal/terms')}>{t.legal.terms.title}</Link></li>
                  <li><Link href={to('/legal/privacy')}>{t.legal.privacy.title}</Link></li>
                  <li><Link href={to('/legal/licenses')}>{t.legal.licenses.title}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="foot-bottom">{t.footer.bottom}</p>
        </footer>
        <BackToTop label={t.ui.backToTop} />
        <Lightbox labels={{ figure: t.ui.enlargedFigure, close: t.ui.close }} />
        <ViewTracker />
      </body>
    </html>
  );
}

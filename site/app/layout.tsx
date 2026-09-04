import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';
import Lightbox from '../components/Lightbox';
import SiteNav from '../components/SiteNav';
import BackToTop from '../components/BackToTop';
import AshParticles from '../components/AshParticles';
import { groups } from '../lib/lessons';

export const metadata: Metadata = {
  title: { default: '音频信号处理二十三讲', template: '%s · 音频信号处理二十三讲' },
  description: '面向零基础中文读者的音频信号处理与机器学习课程：从声音与波形讲到梅尔频谱、MFCC 与频域统计特征。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gs = groups();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 先于首屏应用保存的主题，避免闪一下浅色再切深色 */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body>
        <AshParticles />
        <SiteNav />
        {children}
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand">
              <p className="foot-title">音频信号处理二十三讲</p>
              <p>面向零基础读者的中文课程，改写自 Valerio Velardo 的
                {' '}Audio Signal Processing for ML 系列。</p>
            </div>
            <div className="foot-cols">
              <div>
                <p className="foot-h">五个阶段</p>
                <ul>
                  {gs.map((g) => (
                    <li key={g.group}>
                      <Link href={`/#g${g.group}`}>{g.group.replace('-', '—')}　{g.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="foot-h">相关</p>
                <ul>
                  <li><Link href="/guide">课程导览</Link></li>
                  <li><a href="https://github.com/EthanBAI-dev/Audio-ML-note">GitHub 仓库</a></li>
                  <li><a href="https://github.com/EthanBAI-dev/Audio-ML-note/tree/main/%E9%9F%B3%E9%A2%91%E4%BF%A1%E5%8F%B7%E5%A4%84%E7%90%86%E4%BA%8C%E5%8D%81%E4%B8%89%E8%AE%B2/%E8%AF%BE%E7%A8%8B%E4%BB%A3%E7%A0%81">课程代码</a></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="foot-bottom">正文与配图由本仓库生成；课程音频版权归原作者所有。</p>
        </footer>
        <BackToTop />
        <Lightbox />
      </body>
    </html>
  );
}

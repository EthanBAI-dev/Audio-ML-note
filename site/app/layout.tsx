import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';
import ThemeToggle from '../components/ThemeToggle';

export const metadata: Metadata = {
  title: { default: '音频信号处理二十三讲', template: '%s · 音频信号处理二十三讲' },
  description: '面向零基础中文读者的音频信号处理与机器学习课程：从声音与波形讲到梅尔频谱、MFCC 与频域统计特征。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 先于首屏应用保存的主题，避免闪一下浅色再切深色 */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body>
        {children}
        <footer className="site-footer">
          课程改写自 Valerio Velardo 的 Audio Signal Processing for ML 系列。正文、配图与代码见
          {' '}<a href="https://github.com/EthanBAI-dev/Audio-ML-note">仓库</a>。
        </footer>
      </body>
    </html>
  );
}

export function Masthead({ eyebrow, title, lead }: { eyebrow: React.ReactNode; title: string; lead?: string }) {
  return (
    <>
      <header className="top">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
      </header>
      <div className="toolbar">
        <Link href="/">目录</Link>
        <Link href="/guide">课程总纲</Link>
        <Link href="/project">课程项目</Link>
        <ThemeToggle />
      </div>
    </>
  );
}

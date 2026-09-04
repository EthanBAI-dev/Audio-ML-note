import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '音频信号处理二十三讲', template: '%s · 音频信号处理二十三讲' },
  description: '面向零基础中文读者的音频信号处理与机器学习课程：从声音与波形讲到梅尔频谱、MFCC 与频域统计特征。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">音频信号处理二十三讲</Link>
          <nav>
            <Link href="/guide">课程总纲</Link>
            <Link href="/project">课程项目</Link>
            <a href="https://github.com/EthanBAI-dev/Audio-ML-note">源码</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>课程改写自 Valerio Velardo 的 Audio Signal Processing for ML 系列。正文、配图与代码见仓库。</p>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';
import Lightbox from '../components/Lightbox';
import SiteNav from '../components/SiteNav';
import BackToTop from '../components/BackToTop';
import ViewTracker from '../components/ViewTracker';

export const metadata: Metadata = {
  title: { default: 'Ethan 音乐实验室', template: '%s · Ethan 音乐实验室' },
  description: 'Ethan 的个人音乐实验室：用课程、声音实验和研究笔记，把音频信号处理、音频机器学习与创作者工具讲到谁都能看懂。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteNav />
        {children}
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand">
              <p className="foot-title">Ethan 音乐实验室</p>
              <p>一个关于声音、音乐与 AI 的个人实验室。</p>
            </div>
            <div className="foot-cols">
              <div>
                <p className="foot-h">实验室内容</p>
                <ul>
                  <li><Link href="/courses/audio-ml">音频信号处理二十三讲</Link></li>
                  <li><Link href="/labs">声音实验</Link></li>
                  <li><Link href="/roadmap">学习路线</Link></li>
                  <li><Link href="/courses">全部内容与计划</Link></li>
                </ul>
              </div>
              <div>
                <p className="foot-h">相关</p>
                <ul>
                  <li><Link href="/signin">登录 / 注册</Link></li>
                  <li><Link href="/legal/terms">服务条款</Link></li>
                  <li><Link href="/legal/privacy">隐私说明</Link></li>
                  <li><Link href="/legal/licenses">版权与许可</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="foot-bottom">© 2026 Ethan Music Lab · 用实验理解声音</p>
        </footer>
        <BackToTop />
        <Lightbox />
        <ViewTracker />
      </body>
    </html>
  );
}

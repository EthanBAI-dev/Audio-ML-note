import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';
import Lightbox from '../components/Lightbox';
import SiteNav from '../components/SiteNav';
import BackToTop from '../components/BackToTop';
import { groups } from '../lib/lessons';

export const metadata: Metadata = {
  title: { default: 'Ethan 音乐实验室', template: '%s · Ethan 音乐实验室' },
  description: '用图解、声音和交互实验，把音频信号处理、机器学习与创作者工具做成谁都能看懂的系统课程。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gs = groups();
  return (
    <html lang="zh-CN">
      <body>
        <SiteNav />
        {children}
        <footer className="foot">
          <div className="foot-inner">
            <div className="foot-brand">
              <p className="foot-title">Ethan 音乐实验室</p>
              <p>把难懂的技术做成可以阅读、操作和真正理解的中文课程。</p>
            </div>
            <div className="foot-cols">
              <div>
                <p className="foot-h">第一门课程</p>
                <ul>
                  {gs.map((g) => (
                    <li key={g.group}>
                      <Link href={`/courses/audio-ml#g${g.group}`}>{g.group.replace('-', '—')}　{g.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="foot-h">相关</p>
                <ul>
                  <li><Link href="/courses">全部课程</Link></li>
                  <li><Link href="/roadmap">学习路线</Link></li>
                  <li><Link href="/signin">登录 / 注册</Link></li>
                  <li><Link href="/pricing">购买完整版</Link></li>
                  <li><Link href="/legal/terms">服务条款</Link></li>
                  <li><Link href="/legal/privacy">隐私说明</Link></li>
                  <li><Link href="/legal/refund">退款规则</Link></li>
                  <li><Link href="/legal/licenses">版权与许可</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="foot-bottom">© 2026 Ethan Music Lab · 用实验理解声音</p>
        </footer>
        <BackToTop />
        <Lightbox />
      </body>
    </html>
  );
}

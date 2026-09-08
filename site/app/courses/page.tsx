import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '全部课程', description: 'Ethan 音乐实验室的系统课程与内容计划。' };

export default function CoursesPage() {
  return <div className="shell home directory-shell"><main>
    <header className="directory-hero"><p className="eyebrow">COURSE LIBRARY</p><h1>系统课程</h1><p>每门课都从一个明确任务出发，用文章、图解、声音、代码和交互实验建立完整理解。</p></header>
    <section className="course-catalog">
      <article className="course-product is-live">
        <div className="course-cover"><span>01</span><div className="mini-wave">⌁⌁⌁⌁⌁</div></div>
        <div className="course-copy"><p className="eyebrow">已发布 · 前三讲免费</p><h2>音频信号处理二十三讲</h2><p>从声音是什么开始，逐步建立波形、频谱、声谱图、梅尔频谱和 MFCC 的完整直觉。</p>
          <ul><li>23 讲系统内容</li><li>8 个交互实验</li><li>23 个可运行脚本</li></ul>
          <p className="hero-cta"><Link className="btn" href="/courses/audio-ml">查看课程</Link><Link className="btn ghost" href="/lesson/01">免费试看</Link></p>
        </div>
      </article>
      <article className="course-product is-planned"><div className="course-cover"><span>02</span></div><div className="course-copy"><p className="eyebrow">筹备中</p><h2>音频机器学习实验室</h2><p>围绕一套真实数据完成特征、训练、评估和误差分析。完成课程设计后开放。</p></div></article>
      <article className="course-product is-planned"><div className="course-cover"><span>03</span></div><div className="course-copy"><p className="eyebrow">内容计划</p><h2>创作者工具与 AI</h2><p>把内容生产、自动化和 AI 工具沉淀成可复用的创作工作流。</p></div></article>
    </section>
  </main></div>;
}

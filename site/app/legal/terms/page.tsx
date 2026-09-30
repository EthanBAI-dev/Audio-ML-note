import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="shell home legal-shell"><main><article>
      <h1>服务条款</h1>
      <p className="legal-updated">最后更新：2026 年 9 月 30 日</p>
      <h2>本站提供什么</h2>
      <p>本站免费提供课程文章、动画、声音和交互实验，供个人学习使用。阅读和使用实验不需要登录；登录后可以发表评论。</p>
      <h2>使用范围</h2>
      <p>欢迎为了学习而阅读、引用和分享链接。请不要把本站内容复制后重新发布为你自己的课程，或用于销售。</p>
      <h2>知识产权</h2>
      <p>原创中文文字、原创配图、交互设计与新增代码归其权利人所有；第三方内容继续适用各自许可，详见<Link href="/legal/licenses">版权与第三方许可</Link>。</p>
      <h2>评论</h2>
      <p>登录后可以在页面下方发表评论。评论会公开显示，请围绕内容讨论，不发布广告、骚扰、违法内容或他人的个人信息。经营者可以删除违反这些规则的评论；你也可以随时删除自己的评论。</p>
      <h2>运营者与联系方式</h2>
      <p>运营品牌：Ethan 音乐实验室；创作者：Ethan BAI；所在地：日本；联系邮箱：<a href="mailto:hello@ethanmusiclab.com">hello@ethanmusiclab.com</a>。</p>
      <h2>适用法律与争议处理</h2>
      <p>本条款适用日本法律，但不排除消费者所在地依法必须适用的强制性消费者保护规定。发生争议时，双方应先通过上述邮箱协商；协商不成的，由日本法律规定具有管辖权的法院处理。</p>
    </article></main></div>
  );
}

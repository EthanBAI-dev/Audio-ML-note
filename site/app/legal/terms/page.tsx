import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="shell home legal-shell"><main><article>
      <h1>服务条款</h1>
      <p className="legal-updated">最后更新：2026 年 9 月 9 日</p>
      <h2>课程服务</h2>
      <p>本站提供数字课程的在线阅读、动画、声音和交互实验。购买互动持续版包含该课程的后续勘误与内容优化，但不自动包含未来作为独立商品发布的其他课程。具体价格、内容范围与访问期限以购买页面显示为准。</p>
      <h2>访问权</h2>
      <p>购买取得的是个人学习用途的访问许可，不包括转售、批量共享账号、复制后重新发布或将课程作为自己的课程销售。</p>
      <h2>知识产权</h2>
      <p>原创中文文字、原创配图、交互设计与新增代码归其权利人所有；第三方内容继续适用各自许可，详见<Link href="/legal/licenses">版权与第三方许可</Link>。</p>
      <h2>支付与退款</h2>
      <p>支付由第三方支付服务商完成。退款条件见<Link href="/legal/refund">退款规则</Link>。适用法律中的强制性消费者权利不受本条款排除。</p>
      <h2>会员群</h2>
      <p>课程会员群是购买后的附加交流服务，不是课程内容的唯一交付渠道。为维护讨论质量，经营者可以依群规处理广告、骚扰、盗版传播等行为，并可在群容量或平台条件变化时迁移交流渠道。</p>
      <h2>经营者与联系方式</h2>
      <p>运营品牌：Ethan 音乐实验室；创作者：Ethan BAI；所在地：日本；联系邮箱：<a href="mailto:hello@ethanmusiclab.com">hello@ethanmusiclab.com</a>。法定经营者信息及交易条件见<Link href="/legal/commercial-disclosure">特定商取引法相关说明</Link>。</p>
      <h2>适用法律与争议处理</h2>
      <p>本条款适用日本法律，但不排除消费者所在地依法必须适用的强制性消费者保护规定。发生争议时，双方应先通过客服协商；协商不成的，由日本法律规定具有管辖权的法院处理。</p>
    </article></main></div>
  );
}

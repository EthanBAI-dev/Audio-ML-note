import Link from 'next/link';

export default function CommercialDisclosurePage() {
  return (
    <div className="shell home legal-shell"><main><article>
      <h1>特定商取引法相关说明</h1>
      <p className="legal-updated">最后更新：2026 年 9 月 9 日</p>
      <h2>运营品牌</h2>
      <p>Ethan 音乐实验室</p>
      <h2>法定经营者、地址与电话号码</h2>
      <p>为保护个人经营者的隐私，应消费者在购买前提出的请求，本站将通过电子邮件及时提供法定经营者姓名、实际经营地址和可联系的电话号码。</p>
      <p>请求邮箱：<a href="mailto:hello@ethanmusiclab.com?subject=特定商取引法信息请求">hello@ethanmusiclab.com</a></p>
      <h2>销售价格与额外费用</h2>
      <p>销售价格以购买页面显示为准。访问课程所需的网络通信费由购买者自行承担；除此之外，本站不另行收取强制费用。</p>
      <h2>支付方式与支付时间</h2>
      <p>使用购买页面显示的第三方支付方式一次性付款，订单提交时完成支付。</p>
      <h2>服务交付时间</h2>
      <p>支付成功并完成订单确认后立即向购买账号授予课程访问权。如未正常开通，请通过客服邮箱联系处理。</p>
      <h2>退款与取消</h2>
      <p>购买后 7 个自然日内可以申请退款；具体条件、申请方法与到账时间见<Link href="/legal/refund">退款规则</Link>。</p>
      <h2>技术要求</h2>
      <p>课程通过现代网页浏览器在线提供。声音与交互实验需要支持 JavaScript 和 Web Audio 的浏览器及可用的网络连接。</p>
    </article></main></div>
  );
}

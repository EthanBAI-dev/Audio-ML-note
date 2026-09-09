import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="shell home legal-shell"><main><article>
      <h1>隐私说明</h1>
      <p className="legal-updated">最后更新：2026 年 9 月 9 日</p>
      <h2>信息处理者</h2>
      <p>本站由位于日本的 Ethan 音乐实验室运营。隐私相关请求请发送至 <a href="mailto:hello@ethanmusiclab.com">hello@ethanmusiclab.com</a>。法定经营者信息可按<Link href="/legal/commercial-disclosure">特定商取引法相关说明</Link>所列方式请求。</p>
      <h2>本站处理的信息</h2>
      <p>免费阅读不要求注册。购买时，支付服务商可能处理姓名、邮箱、付款方式和订单信息；本站只接收确认订单与恢复访问所需的有限信息。</p>
      <h2>本地数据</h2>
      <p>主题偏好保存在浏览器本地。购买成功后，本站会设置仅服务器可读的访问凭证 Cookie，用于判断是否已经解锁课程。</p>
      <h2>不会收集的内容</h2>
      <p>本站不保存银行卡号、支付密码或第三方钱包密码。支付页面由支付服务商托管。</p>
      <h2>保存与删除</h2>
      <p>账号数据在提供课程访问服务所需期间保存；订单及交易记录按财务、退款和适用法律要求的期限保存。保存期限届满或不再具有处理必要性后，数据将被删除或匿名化，但法律要求继续保存的除外。</p>
      <h2>查询、更正与删除</h2>
      <p>用户可以通过上述邮箱申请查询、更正或删除账号相关信息。本站会在核实请求者身份后于合理期限内处理；涉及订单、税务、安全或争议处理而依法需要保留的信息，可能无法立即删除。</p>
    </article></main></div>
  );
}

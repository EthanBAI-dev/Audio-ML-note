import type { Metadata } from 'next';
import Link from 'next/link';
import { courseOriginalPriceLabel, coursePriceLabel, paymentsConfigured } from '../../lib/commerce';
import { auth, wechatAuthConfigured } from '../../auth';

export const metadata: Metadata = {
  title: '购买互动持续版',
  description: '解锁音频信号处理二十三讲的动画、声音、交互实验、跨设备学习、会员群与课程更新。',
};

export default async function PricingPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const session = wechatAuthConfigured ? await auth() : null;
  const ready = paymentsConfigured() && wechatAuthConfigured;
  const notice = query.checkout === 'cancelled'
    ? '订单已取消，没有产生扣款。'
    : query.checkout
      ? '暂时无法确认这笔订单，请稍后重试或联系支持。'
      : query.setup === 'required'
        ? '支付通道尚未启用。'
        : '';

  return (
    <div className="shell home commerce-shell">
      <main>
        <section className="commerce-hero">
          <p className="eyebrow">从静态阅读，到亲手操作</p>
          <h1>不只看懂，还要听见、拖动并真正理解</h1>
          <p>免费图文版负责把知识讲清楚；互动持续版把动画、声音、实验、跨设备学习和课程服务放在一起。</p>
        </section>

        {notice ? <p className="commerce-notice" role="status">{notice}</p> : null}

        <section className="edition-compare" aria-label="课程版本比较">
          <article><p className="eyebrow">免费静态图文版</p><h2>适合阅读与分享</h2><ul><li>基础文字与普通图片</li><li>公众号、小红书等渠道可阅读</li><li>少量官网试听与互动样例</li><li>无需注册即可开始</li></ul><Link className="btn ghost" href="/lesson/01">免费试看</Link></article>
          <article className="is-premium"><p className="eyebrow">付费互动持续版</p><h2>适合系统学习</h2><ul><li>完整动画、声音和交互实验</li><li>手机与电脑跨设备访问</li><li>课程会员群、交流和反馈</li><li>持续获得本课程更新</li></ul><a className="text-link" href="#purchase">查看价格 ↓</a></article>
        </section>

        <section className="price-card" id="purchase" aria-labelledby="price-title">
          <div>
            <p className="eyebrow">互动持续版</p>
            <h2 id="price-title">音频信号处理二十三讲</h2>
            <p className="price">
              <strong>{coursePriceLabel()}</strong>
              <span>当前价 · 单次购买</span>
              <del>原价 {courseOriginalPriceLabel()}</del>
            </p>
          </div>
          <ul className="feature-list">
            <li>23 讲当前版本完整课程</li>
            <li>动画、声音和 8 个浏览器交互实验</li>
            <li>登录后手机、平板和电脑均可访问</li>
            <li>会员群交流、反馈和更新通知</li>
            <li>本课程后续勘误与内容升级</li>
          </ul>
          {ready && session?.user ? (
            <form action="/api/checkout" method="post">
              <button className="btn purchase-button" type="submit">前往安全支付</button>
            </form>
          ) : ready ? (
            <Link className="btn purchase-button" href="/signin?returnTo=/pricing">登录后购买</Link>
          ) : (
            <Link className="btn purchase-button" href="/lesson/01">先学习免费章节</Link>
          )}
          {!ready ? <p className="availability-note">完整版购买入口正在准备。开放后会在这里直接显示登录与支付入口。</p> : null}
          <p className="fine-print">
            支付由第三方支付服务商处理；本站不接触银行卡或钱包密码。购买前请阅读
            <Link href="/legal/terms">服务条款</Link>与<Link href="/legal/refund">退款规则</Link>。
          </p>
        </section>

        <section className="commerce-section">
          <h2>先免费判断它适不适合你</h2>
          <p>保留基础图文和少量声音、交互样例免费开放。先真实体验互动版比静态文章多了什么，再决定是否购买。</p>
          <Link className="btn ghost" href="/lesson/01">从第 01 讲开始试看</Link>
        </section>

        <section className="commerce-section faq">
          <h2>购买说明</h2>
          <details><summary>购买后怎样访问？</summary><p>支付成功后课程权益绑定到你的登录账户。使用同一账号，即可在手机或电脑继续学习。</p></details>
          <details><summary>后续更新包含什么？</summary><p>包含这门课程的勘误、表达优化、新图解和新增案例；不自动包含未来单独发布的其他课程。</p></details>
          <details><summary>怎样加入会员群？</summary><p>购买后在学习中心提交入群申请。验证课程权益后发送邀请，群内用于课程交流、反馈和更新通知。</p></details>
          <details><summary>课程适合零基础吗？</summary><p>适合。专业词会在第一次使用前解释，公式、代码和图形按同一条学习路线推进。</p></details>
          <details><summary>能否退款？</summary><p>重复支付、无法正常交付等情况按退款规则处理；其他情况受数字内容性质和适用法律约束。</p></details>
        </section>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { coursePriceLabel, paymentsConfigured } from '../lib/commerce';

export default function Paywall({ compact = false }: { compact?: boolean }) {
  const ready = paymentsConfigured();
  return (
    <section className={`paywall${compact ? ' paywall-compact' : ''}`} aria-labelledby="paywall-title">
      <p className="eyebrow">互动持续版</p>
      <h2 id="paywall-title">静态图文到这里，接下来让声音和图形动起来</h2>
      <p>购买后解锁完整课程，以及只有官网互动版才能提供的声音、动画和可操作实验。</p>
      <ul>
        <li>完整声音对比、分步动画与 8 个交互实验</li>
        <li>微信账号登录，手机和电脑同步访问</li>
        <li>申请加入课程会员群，交流、反馈和接收更新</li>
        <li>持续获得这门课程的勘误与内容升级</li>
      </ul>
      <div className="purchase-actions">
        {ready ? (
          <form action="/api/checkout" method="post">
            <button className="btn purchase-button" type="submit">{coursePriceLabel()} 解锁完整版</button>
          </form>
        ) : (
          <Link className="btn purchase-button" href="/lesson/01">先学习免费章节</Link>
        )}
        <Link className="text-link" href="/pricing">比较免费版与互动版</Link>
      </div>
      {!ready ? <p className="availability-note">完整版购买入口正在准备，免费章节和公开实验可以正常使用。</p> : null}
    </section>
  );
}

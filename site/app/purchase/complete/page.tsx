import Link from 'next/link';
import { hasCourseAccess } from '../../../lib/access';

export default async function PurchaseCompletePage() {
  const unlocked = await hasCourseAccess();
  return (
    <div className="shell home commerce-shell">
      <main>
        <section className="purchase-complete">
          <p className="eyebrow">{unlocked ? '支付成功' : '正在确认访问权'}</p>
          <h1>{unlocked ? '完整版已经解锁' : '还没有找到有效的购买凭证'}</h1>
          <p>{unlocked
            ? '这台设备现在可以阅读全部 23 讲。请保留支付回执，以便需要时核验订单。'
            : '请从支付成功页面返回本站。如果已经完成扣款但仍看到这里，请通过订单回执联系支持。'}</p>
          <p className="hero-cta">
            <Link className="btn" href={unlocked ? '/lesson/04' : '/pricing'}>
              {unlocked ? '继续第 04 讲' : '返回购买页面'}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

import type Stripe from 'stripe';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from './db';
import { entitlements, orders } from './db/schema';

export async function grantStripeCheckout(session: Stripe.Checkout.Session): Promise<void> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const userId = session.metadata?.userId;
  const productId = session.metadata?.productId;
  if (!userId || !productId || session.payment_status !== 'paid') {
    throw new Error('Checkout session does not contain a paid course order');
  }

  const paidAt = new Date();
  await db.insert(orders).values({
    id: session.id,
    userId,
    productId,
    provider: 'stripe',
    externalOrderId: session.id,
    status: 'paid',
    amount: session.amount_total ?? 0,
    currency: session.currency ?? 'cny',
    paidAt,
  }).onConflictDoUpdate({
    target: [orders.provider, orders.externalOrderId],
    set: { status: 'paid', paidAt, refundedAt: null },
  });

  await db.insert(entitlements).values({
    userId,
    productId,
    sourceOrderId: session.id,
    grantedAt: paidAt,
  }).onConflictDoUpdate({
    target: [entitlements.userId, entitlements.productId],
    set: { sourceOrderId: session.id, grantedAt: paidAt, revokedAt: null },
  });
}

export async function revokeStripeCheckout(sessionId: string): Promise<void> {
  if (!db) throw new Error('DATABASE_URL is not configured');
  const refundedAt = new Date();
  await db.update(orders).set({ status: 'refunded', refundedAt })
    .where(and(eq(orders.provider, 'stripe'), eq(orders.externalOrderId, sessionId)));
  await db.update(entitlements).set({ revokedAt: refundedAt })
    .where(eq(entitlements.sourceOrderId, sessionId));
}

export async function userHasEntitlement(userId: string, productId: string): Promise<boolean> {
  if (!db) return false;
  const rows = await db.select({ id: entitlements.id }).from(entitlements).where(and(
    eq(entitlements.userId, userId),
    eq(entitlements.productId, productId),
    isNull(entitlements.revokedAt),
    or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, new Date())),
  )).limit(1);
  return rows.length > 0;
}

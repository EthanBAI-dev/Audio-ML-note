import { NextResponse } from 'next/server';
import { stripeClient } from '../../../../lib/stripe';
import { db } from '../../../../lib/db';
import { grantStripeCheckout, revokeStripeCheckout } from '../../../../lib/entitlements';

export async function POST(request: Request) {
  const stripe = stripeClient();
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!stripe || !signingSecret || !signature || !db) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }
  try {
    const event = stripe.webhooks.constructEvent(await request.text(), signature, signingSecret);
    if ((event.type === 'checkout.session.completed'
      || event.type === 'checkout.session.async_payment_succeeded')
      && event.data.object.payment_status === 'paid') {
      await grantStripeCheckout(event.data.object);
    }
    if (event.type === 'charge.refunded' && event.data.object.payment_intent) {
      const matches = await stripe.checkout.sessions.list({
        payment_intent: String(event.data.object.payment_intent),
        limit: 1,
      });
      if (matches.data[0]) await revokeStripeCheckout(matches.data[0].id);
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }
}

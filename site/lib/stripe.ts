import Stripe from 'stripe';

let client: Stripe | null = null;

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key, {
      appInfo: { name: 'Audio ML Note', version: '1.0.0' },
    });
  }
  return client;
}

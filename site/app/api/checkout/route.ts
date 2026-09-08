import { NextResponse } from 'next/server';
import { COURSE_PRODUCT, coursePriceCents, paymentsConfigured } from '../../../lib/commerce';
import { stripeClient } from '../../../lib/stripe';
import { auth, wechatAuthConfigured } from '../../../auth';

function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!paymentsConfigured()) {
    return NextResponse.redirect(new URL('/pricing?setup=required', request.url), 303);
  }
  if (!wechatAuthConfigured) {
    return NextResponse.redirect(new URL('/signin?setup=required&returnTo=/pricing', request.url), 303);
  }
  const account = await auth();
  const userId = account?.user
    ? (account.user as typeof account.user & { id?: string }).id
    : undefined;
  if (!userId) {
    return NextResponse.redirect(new URL('/signin?returnTo=/pricing', request.url), 303);
  }
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.redirect(new URL('/pricing?setup=required', request.url), 303);
  }

  try {
    const origin = siteOrigin(request);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'zh',
      customer_creation: 'always',
      allow_promotion_codes: true,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: COURSE_PRODUCT.currency,
          unit_amount: coursePriceCents(),
          product_data: {
            name: COURSE_PRODUCT.name,
            description: COURSE_PRODUCT.description,
          },
        },
      }],
      client_reference_id: userId,
      metadata: { productId: COURSE_PRODUCT.id, userId },
      success_url: `${origin}/api/purchase/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      custom_text: {
        submit: { message: '完成支付即表示你同意网站的服务条款与退款规则。' },
      },
    });

    if (!session.url) {
      return NextResponse.redirect(new URL('/pricing?checkout=unavailable', request.url), 303);
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error('Unable to create Stripe Checkout session', error);
    return NextResponse.redirect(new URL('/pricing?checkout=unavailable', request.url), 303);
  }
}

import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, accessCookieOptions, issueAccessToken } from '../../../../lib/access';
import { COURSE_PRODUCT } from '../../../../lib/commerce';
import { stripeClient } from '../../../../lib/stripe';
import { auth } from '../../../../auth';
import { grantStripeCheckout } from '../../../../lib/entitlements';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const stripe = stripeClient();
  const account = await auth();
  const userId = account?.user
    ? (account.user as typeof account.user & { id?: string }).id
    : undefined;
  if (!sessionId || !stripe || !userId) {
    return NextResponse.redirect(new URL('/pricing?checkout=invalid', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid'
      || session.metadata?.productId !== COURSE_PRODUCT.id
      || session.metadata?.userId !== userId) {
      return NextResponse.redirect(new URL('/pricing?checkout=unpaid', request.url));
    }
    await grantStripeCheckout(session);
    const token = issueAccessToken({
      productId: COURSE_PRODUCT.id,
      orderId: session.id,
      email: session.customer_details?.email ?? undefined,
      issuedAt: Date.now(),
    });
    const response = NextResponse.redirect(new URL('/purchase/complete', request.url));
    response.cookies.set(ACCESS_COOKIE, token, accessCookieOptions);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/pricing?checkout=invalid', request.url));
  }
}

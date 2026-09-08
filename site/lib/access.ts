import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { COURSE_PRODUCT } from './commerce';
import { auth, wechatAuthConfigured } from '../auth';
import { userHasEntitlement } from './entitlements';

export const ACCESS_COOKIE = 'audio_ml_course_access';
const MAX_AGE = 60 * 60 * 24 * 365 * 5;

type AccessPayload = {
  productId: string;
  orderId: string;
  email?: string;
  issuedAt: number;
};

function secret(): string | null {
  return process.env.COURSE_ACCESS_SECRET || null;
}

function signature(encoded: string, key: string): string {
  return createHmac('sha256', key).update(encoded).digest('base64url');
}

export function issueAccessToken(payload: AccessPayload): string {
  const key = secret();
  if (!key) throw new Error('COURSE_ACCESS_SECRET is not configured');
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded, key)}`;
}

export function verifyAccessToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) return false;
  const expected = signature(encoded, key);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AccessPayload;
    return payload.productId === COURSE_PRODUCT.id
      && Number.isFinite(payload.issuedAt)
      && payload.issuedAt <= Date.now();
  } catch {
    return false;
  }
}

export async function hasCourseAccess(): Promise<boolean> {
  if (wechatAuthConfigured) {
    const session = await auth();
    const userId = session?.user
      ? (session.user as typeof session.user & { id?: string }).id
      : undefined;
    return userId ? userHasEntitlement(userId, COURSE_PRODUCT.id) : false;
  }
  const store = await cookies();
  return verifyAccessToken(store.get(ACCESS_COOKIE)?.value);
}

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};

import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import { cookies } from '../../lib/headers';
import { cache } from 'react';
import { db, s } from '../../db';
import { ExpiringTokenBucket } from './rate-limit';
import { getCurrentSession } from './session';
import { generateRandomOTP } from './utils';
import { env } from '../../env';
import { sendEmail } from './email';

export async function getUserEmailVerificationRequest(userId: number, id: string) {
  const [result] = await db
    .select({
      id: s.emailVerificationRequest.id,
      userId: s.emailVerificationRequest.userId,
      code: s.emailVerificationRequest.code,
      email: s.emailVerificationRequest.email,
      expiresAt: s.emailVerificationRequest.expiresAt,
    })
    .from(s.emailVerificationRequest)
    .where(and(eq(s.emailVerificationRequest.id, id), eq(s.emailVerificationRequest.userId, userId)));
  if (!result) return null;
  return result;
}

export async function createEmailVerificationRequest(userId: number, email: string) {
  await deleteUserEmailVerificationRequest(userId);
  const idBytes = new Uint8Array(20);
  crypto.getRandomValues(idBytes);
  const id = encodeBase32LowerCaseNoPadding(idBytes);

  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  await db.insert(s.emailVerificationRequest).values({
    id,
    userId,
    code,
    email,
    expiresAt,
  });

  const request: EmailVerificationRequest = { id, userId, code, email, expiresAt };
  return request;
}

export async function deleteUserEmailVerificationRequest(userId: number) {
  await db.delete(s.emailVerificationRequest).where(eq(s.emailVerificationRequest.userId, userId));
}

export async function sendVerificationEmail(email: string, code: string) {
  if (env.NODE_ENV === 'development') {
    console.log('Your verification code is', code);
  }
  await sendEmail({
    to: email,
    subject: 'Verification Code',
    html: `<p>Your verification code is ${code}</p>`,
  });
}

export async function setEmailVerificationRequestCookie(request: EmailVerificationRequest): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set('email_verification', request.id, {
    httpOnly: true,
    path: '/',
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    expires: request.expiresAt,
  });
}

export async function deleteEmailVerificationRequestCookie(): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set('email_verification', '', {
    httpOnly: true,
    path: '/',
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 0,
  });
}

export const getCurrentUserEmailVerificationRequest = cache(async () => {
  const { user } = await getCurrentSession();
  if (user === null) return null;

  const cookiesList = await cookies();
  const id = cookiesList.get('email_verification')?.value ?? null;
  if (id === null) return null;

  const request = await getUserEmailVerificationRequest(user.id, id);
  if (request === null) {
    await deleteEmailVerificationRequestCookie();
  }
  return request;
});

export const sendVerificationEmailBucket = new ExpiringTokenBucket<number>(3, 60 * 10);

export interface EmailVerificationRequest {
  id: string;
  userId: number;
  code: string;
  email: string;
  expiresAt: Date;
}

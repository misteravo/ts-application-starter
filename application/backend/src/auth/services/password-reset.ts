import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { cookies } from '../../lib/headers';
import { cache } from 'react';
import { generateRandomOTP } from './utils';

import { eq } from 'drizzle-orm';
import { db, s } from '../../db';
import { sqlNotNull } from '../../db/utils';
import type { User } from './user';
import { env } from '../../env';
import { sendEmail } from './email';

export async function createPasswordResetSession(token: string, userId: number, email: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: PasswordResetSession = {
    id: sessionId,
    userId,
    email,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    code: generateRandomOTP(),
    emailVerified: false,
    twoFactorVerified: false,
  };
  await db.insert(s.passwordResetSession).values({
    id: session.id,
    userId: session.userId,
    email: session.email,
    code: session.code,
    expiresAt: session.expiresAt,
  });
  return session;
}

export async function validatePasswordResetSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [row] = await db
    .select({
      session: {
        id: s.passwordResetSession.id,
        userId: s.passwordResetSession.userId,
        email: s.passwordResetSession.email,
        code: s.passwordResetSession.code,
        expiresAt: s.passwordResetSession.expiresAt,
        emailVerified: s.passwordResetSession.emailVerified.getSQL().mapWith(Boolean),
        twoFactorVerified: s.passwordResetSession.twoFactorVerified.getSQL().mapWith(Boolean),
      },
      user: {
        id: s.user.id,
        email: s.user.email,
        username: s.user.username,
        emailVerified: s.user.emailVerified.getSQL().mapWith(Boolean),
        registeredTOTP: sqlNotNull(s.totpCredential.id),
        registeredPasskey: sqlNotNull(s.passkeyCredential.id),
        registeredSecurityKey: sqlNotNull(s.securityKeyCredential.id),
      },
    })
    .from(s.passwordResetSession)
    .innerJoin(s.user, eq(s.passwordResetSession.userId, s.user.id))
    .leftJoin(s.totpCredential, eq(s.user.id, s.totpCredential.userId))
    .leftJoin(s.passkeyCredential, eq(s.user.id, s.passkeyCredential.userId))
    .leftJoin(s.securityKeyCredential, eq(s.user.id, s.securityKeyCredential.userId))
    .where(eq(s.passwordResetSession.id, sessionId))
    .limit(1);

  if (!row) return { session: null, user: null };

  const session: PasswordResetSession = row.session;
  const user: User = {
    ...row.user,
    registered2FA: row.user.registeredPasskey || row.user.registeredSecurityKey || row.user.registeredTOTP,
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(s.passwordResetSession).where(eq(s.passwordResetSession.id, session.id));
    return { session: null, user: null };
  }
  return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string) {
  await db.update(s.passwordResetSession).set({ emailVerified: true }).where(eq(s.passwordResetSession.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
  await db
    .update(s.passwordResetSession)
    .set({ twoFactorVerified: true })
    .where(eq(s.passwordResetSession.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: number) {
  await db.delete(s.passwordResetSession).where(eq(s.passwordResetSession.userId, userId));
}

export const getCurrentPasswordResetSession = cache(async () => {
  const cookiesList = await cookies();
  const token = cookiesList.get('password_reset_session')?.value ?? null;
  if (token === null) return { session: null, user: null };

  const result = await validatePasswordResetSessionToken(token);
  if (!result.session) await deletePasswordResetSessionTokenCookie();

  return result;
});

export async function setPasswordResetSessionTokenCookie(token: string, expiresAt: Date) {
  const cookiesList = await cookies();
  cookiesList.set('password_reset_session', token, {
    expires: expiresAt,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    secure: env.COOKIE_SECURE,
  });
}

export async function deletePasswordResetSessionTokenCookie() {
  const cookiesList = await cookies();
  cookiesList.set('password_reset_session', '', {
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    secure: env.COOKIE_SECURE,
  });
}

export async function sendPasswordResetEmail(email: string, code: string) {
  if (env.NODE_ENV === 'development') {
    console.log('Your reset code is', code);
  }
  await sendEmail({
    to: email,
    subject: 'Password Reset Code',
    html: `<p>Your reset code is ${code}</p>`,
  });
}

export interface PasswordResetSession {
  id: string;
  userId: number;
  email: string;
  expiresAt: Date;
  code: string;
  emailVerified: boolean;
  twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
  | { session: PasswordResetSession; user: User }
  | { session: null; user: null };

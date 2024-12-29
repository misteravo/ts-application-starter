import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db, s } from '../../db';
import { sqlNotNull } from '../../db/utils';
import type { User } from './user';

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const [row] = await db
    .select({
      session: {
        id: s.session.id,
        userId: s.session.userId,
        expiresAt: s.session.expiresAt.getSQL().mapWith((value) => new Date(value * 1000)),
        twoFactorVerified: s.session.twoFactorVerified.getSQL().mapWith(Boolean),
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
    .from(s.session)
    .innerJoin(s.user, eq(s.session.userId, s.user.id))
    .leftJoin(s.totpCredential, eq(s.session.userId, s.totpCredential.userId))
    .leftJoin(s.passkeyCredential, eq(s.user.id, s.passkeyCredential.userId))
    .leftJoin(s.securityKeyCredential, eq(s.user.id, s.securityKeyCredential.userId))
    .where(eq(s.session.id, sessionId))
    .limit(1);

  if (!row) return { session: null, user: null };

  const session: Session = row.session;
  const user: User = {
    ...row.user,
    registered2FA: row.user.registeredPasskey || row.user.registeredSecurityKey || row.user.registeredTOTP,
  };

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(s.session).where(eq(s.session.id, sessionId));
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(s.session)
      .set({ expiresAt: Math.floor(session.expiresAt.getTime() / 1000) })
      .where(eq(s.session.id, sessionId));
  }
  return { session, user };
}

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
  const cookiesList = await cookies();
  const token = cookiesList.get('session')?.value ?? null;
  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validateSessionToken(token);
  return result;
});

export async function invalidateSession(sessionId: string) {
  await db.delete(s.session).where(eq(s.session.id, sessionId));
}

export async function invalidateUserSessions(userId: number) {
  await db.delete(s.session).where(eq(s.session.userId, userId));
}

export async function setSessionTokenCookie(token: string, expiresAt: Date): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set('session', token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  });
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set('session', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
}

export function generateSessionToken(): string {
  const tokenBytes = new Uint8Array(20);
  crypto.getRandomValues(tokenBytes);
  const token = encodeBase32LowerCaseNoPadding(tokenBytes);
  return token;
}

export async function createSession(token: string, userId: number, flags: SessionFlags) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    twoFactorVerified: flags.twoFactorVerified,
  };
  await db.insert(s.session).values({
    id: session.id,
    userId: session.userId,
    expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
    twoFactorVerified: Number(session.twoFactorVerified),
  });
  return session;
}

export async function setSessionAs2FAVerified(sessionId: string) {
  await db.update(s.session).set({ twoFactorVerified: 1 }).where(eq(s.session.id, sessionId));
}

export interface SessionFlags {
  twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
  id: string;
  expiresAt: Date;
  userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

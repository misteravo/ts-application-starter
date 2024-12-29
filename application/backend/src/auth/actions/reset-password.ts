'use server';

import { verifyPasswordStrength } from '../services/password';
import {
  deletePasswordResetSessionTokenCookie,
  getCurrentPasswordResetSession,
  invalidateUserPasswordResetSessions,
  setPasswordResetSessionAsEmailVerified,
} from '../services/password-reset';
import { ExpiringTokenBucket } from '../services/rate-limit';
import {
  createSession,
  generateSessionToken,
  invalidateUserSessions,
  setSessionTokenCookie,
} from '../services/session';
import { setUserAsEmailVerifiedIfEmailMatches, updateUserPassword } from '../services/user';

type Result = { message: string } | { redirect: string };

export async function resetPassword({ password }: { password: string }): Promise<Result> {
  const { session: passwordResetSession, user } = await getCurrentPasswordResetSession();
  if (passwordResetSession === null) return { message: 'Not authenticated' };
  if (!passwordResetSession.emailVerified) return { message: 'Forbidden' };

  if (user.registered2FA && !passwordResetSession.twoFactorVerified) return { message: 'Forbidden' };

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) return { message: 'Weak password' };

  await invalidateUserPasswordResetSessions(passwordResetSession.userId);
  await invalidateUserSessions(passwordResetSession.userId);
  await updateUserPassword(passwordResetSession.userId, password);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerified: passwordResetSession.twoFactorVerified,
  });
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  await deletePasswordResetSessionTokenCookie();
  return { redirect: '/' };
}

const emailVerificationBucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function verifyPasswordResetEmail({ code }: { code: string }): Promise<Result> {
  const { session } = await getCurrentPasswordResetSession();
  if (session === null) return { message: 'Not authenticated' };
  if (session.emailVerified) return { message: 'Forbidden' };

  if (!emailVerificationBucket.check(session.userId, 1)) return { message: 'Too many requests' };

  if (code === '') return { message: 'Please enter your code' };

  if (!emailVerificationBucket.consume(session.userId, 1)) return { message: 'Too many requests' };

  if (code !== session.code) return { message: 'Incorrect code' };

  emailVerificationBucket.reset(session.userId);
  await setPasswordResetSessionAsEmailVerified(session.id);

  const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
  if (!emailMatches) return { message: 'Please restart the process' };

  return { redirect: '/reset-password/2fa' };
}

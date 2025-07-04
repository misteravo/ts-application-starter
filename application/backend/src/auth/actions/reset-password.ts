'use server';

import { ClientError } from '@acme/utils';
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

export async function resetPassword({ password }: { password: string }): Promise<{ redirect: string }> {
  const { session: passwordResetSession, user } = await getCurrentPasswordResetSession();
  if (!passwordResetSession) throw new ClientError('Not authenticated');
  if (!passwordResetSession.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !passwordResetSession.twoFactorVerified) throw new ClientError('Forbidden');

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) throw new ClientError('Weak password');

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

export async function verifyPasswordResetEmail({ code }: { code: string }): Promise<{ redirect: string }> {
  const { session } = await getCurrentPasswordResetSession();
  if (!session) throw new ClientError('Not authenticated');
  if (session.emailVerified) throw new ClientError('Forbidden');

  if (!emailVerificationBucket.check(session.userId, 1)) throw new ClientError('Too many requests');

  if (code === '') throw new ClientError('Please enter your code');

  if (!emailVerificationBucket.consume(session.userId, 1)) throw new ClientError('Too many requests');

  if (code !== session.code) throw new ClientError('Incorrect code');

  emailVerificationBucket.reset(session.userId);
  await setPasswordResetSessionAsEmailVerified(session.id);

  const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
  if (!emailMatches) throw new ClientError('Please restart the process');

  return { redirect: '/reset-password/2fa' };
}

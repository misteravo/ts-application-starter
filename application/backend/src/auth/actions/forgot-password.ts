'use server';

import { getClientIP } from '../../lib/headers';
import { verifyEmailInput } from '../services/email';
import {
  createPasswordResetSession,
  invalidateUserPasswordResetSessions,
  sendPasswordResetEmail,
  setPasswordResetSessionTokenCookie,
} from '../services/password-reset';
import { RefillingTokenBucket } from '../services/rate-limit';
import { generateSessionToken } from '../services/session';
import { getUserFromEmail } from '../services/user';

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);
const passwordResetEmailUserBucket = new RefillingTokenBucket<number>(3, 60);

type Result = { message: string } | { redirect: string };

export async function forgotPassword({ email }: { email: string }): Promise<Result> {
  const clientIP = await getClientIP();
  if (clientIP && !passwordResetEmailIPBucket.check(clientIP, 1)) {
    return { message: 'Too many requests' };
  }

  if (!verifyEmailInput(email)) {
    return {
      message: 'Invalid email',
    };
  }
  const user = await getUserFromEmail(email);
  if (user === null) {
    return {
      message: 'Account does not exist',
    };
  }
  if (clientIP !== null && !passwordResetEmailIPBucket.consume(clientIP, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  if (!passwordResetEmailUserBucket.consume(user.id, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  await invalidateUserPasswordResetSessions(user.id);
  const sessionToken = generateSessionToken();
  const session = await createPasswordResetSession(sessionToken, user.id, user.email);

  await sendPasswordResetEmail(session.email, session.code);
  await setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
  return { redirect: '/reset-password/verify-email' };
}

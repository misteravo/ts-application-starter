import { ClientError } from '@acme/utils';
import { getClientIP } from '../../lib/headers';
import { checkEmailAvailability, verifyEmailInput } from '../services/email';
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from '../services/email-verification';
import { verifyPasswordStrength } from '../services/password';
import { RefillingTokenBucket } from '../services/rate-limit';
import { createSession, generateSessionToken, setSessionTokenCookie } from '../services/session';
import { createUser, verifyUsernameInput } from '../services/user';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function signUp({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}): Promise<{ redirect: string }> {
  const clientIP = await getClientIP();
  if (clientIP && !ipBucket.check(clientIP, 1)) throw new ClientError('Too many requests');

  if (email === '' || password === '' || username === '')
    throw new ClientError('Please enter your username, email, and password');
  if (!verifyEmailInput(email)) throw new ClientError('Invalid email');

  const emailAvailable = await checkEmailAvailability(email);
  if (!emailAvailable) throw new ClientError('Email is already used');
  if (!verifyUsernameInput(username)) throw new ClientError('Invalid username');

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) throw new ClientError('Weak password');
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) throw new ClientError('Too many requests');

  const user = await createUser(email, username, password);
  const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
  await sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
  await setEmailVerificationRequestCookie(emailVerificationRequest);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, { twoFactorVerified: false });
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return { redirect: '/2fa/setup' };
}

import { getClientIP } from '../lib/headers';
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

type Result = { message: string } | { redirect: string };

export async function signUp({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}): Promise<Result> {
  const clientIP = await getClientIP();
  if (clientIP && !ipBucket.check(clientIP, 1)) return { message: 'Too many requests' };

  if (email === '' || password === '' || username === '') {
    return { message: 'Please enter your username, email, and password' };
  }
  if (!verifyEmailInput(email)) return { message: 'Invalid email' };

  const emailAvailable = await checkEmailAvailability(email);
  if (!emailAvailable) return { message: 'Email is already used' };
  if (!verifyUsernameInput(username)) return { message: 'Invalid username' };

  const strongPassword = await verifyPasswordStrength(password);
  if (!strongPassword) return { message: 'Weak password' };
  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) return { message: 'Too many requests' };

  const user = await createUser(email, username, password);
  const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
  sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
  await setEmailVerificationRequestCookie(emailVerificationRequest);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, { twoFactorVerified: false });
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return { redirect: '/2fa/setup' };
}

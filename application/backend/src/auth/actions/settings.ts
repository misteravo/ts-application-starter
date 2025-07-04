import { createSession, setSessionTokenCookie } from '../services/session';

import type { SessionFlags } from '../services/session';

import { generateSessionToken } from '../services/session';

import { verifyPasswordHash } from '../services/password';
import { resetUserRecoveryCode, updateUserPassword } from '../services/user';

import { checkEmailAvailability, verifyEmailInput } from '../services/email';
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  sendVerificationEmailBucket,
  setEmailVerificationRequestCookie,
} from '../services/email-verification';
import { verifyPasswordStrength } from '../services/password';
import { ExpiringTokenBucket } from '../services/rate-limit';
import { getCurrentSession, invalidateUserSessions } from '../services/session';
import { deleteUserTOTPKey, totpUpdateBucket } from '../services/totp';
import { getUserPasswordHash } from '../services/user';
import { safeTrySync, ClientError } from '@acme/utils';
import { decodeBase64 } from '@oslojs/encoding';
import { deleteUserPasskeyCredential, deleteUserSecurityKeyCredential } from '../services/webauthn';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export async function updatePassword(props: { password: string; newPassword: string }) {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');
  if (!passwordUpdateBucket.check(session.id, 1)) throw new ClientError('Too many requests');

  const strongPassword = await verifyPasswordStrength(props.newPassword);
  if (!strongPassword) throw new ClientError('Weak password');

  if (!passwordUpdateBucket.consume(session.id, 1)) throw new ClientError('Too many requests');

  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, props.password);
  if (!validPassword) throw new ClientError('Incorrect password');

  passwordUpdateBucket.reset(session.id);
  await invalidateUserSessions(user.id);
  await updateUserPassword(user.id, props.newPassword);

  const sessionToken = generateSessionToken();
  const sessionFlags: SessionFlags = {
    twoFactorVerified: session.twoFactorVerified,
  };
  const newSession = await createSession(sessionToken, user.id, sessionFlags);
  await setSessionTokenCookie(sessionToken, newSession.expiresAt);
  return { message: 'Updated password' };
}

export async function updateEmail(props: { email: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');
  if (!sendVerificationEmailBucket.check(user.id, 1)) throw new ClientError('Too many requests');

  if (props.email === '') throw new ClientError('Please enter your email');

  if (!verifyEmailInput(props.email)) throw new ClientError('Please enter a valid email');

  const emailAvailable = await checkEmailAvailability(props.email);
  if (!emailAvailable) throw new ClientError('This email is already used');

  if (!sendVerificationEmailBucket.consume(user.id, 1)) throw new ClientError('Too many requests');

  const verificationRequest = await createEmailVerificationRequest(user.id, props.email);
  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  await setEmailVerificationRequestCookie(verificationRequest);
  return { redirect: '/verify-email' };
}

export async function disconnectTOTP() {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');
  if (!totpUpdateBucket.consume(user.id, 1)) throw new ClientError('Too many requests');

  await deleteUserTOTPKey(user.id);
  return { message: 'Disconnected authenticator app' };
}

export async function deletePasskey(props: { encodedCredentialId: string }) {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');

  const [credentialId] = safeTrySync(() => decodeBase64(props.encodedCredentialId));
  if (!credentialId) throw new ClientError('Invalid or missing fields');

  const deleted = await deleteUserPasskeyCredential(user.id, credentialId);
  if (!deleted) throw new ClientError('Invalid credential ID');

  return { message: 'Removed credential' };
}

export async function deleteSecurityKey(props: { encodedCredentialId: string }) {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');

  const [credentialId] = safeTrySync(() => decodeBase64(props.encodedCredentialId));
  if (!credentialId) throw new ClientError('Invalid or missing fields');

  const deleted = await deleteUserSecurityKeyCredential(user.id, credentialId);
  if (!deleted) throw new ClientError('Invalid credential ID');

  return { message: 'Removed credential' };
}

export async function regenerateRecoveryCode() {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');

  const recoveryCode = await resetUserRecoveryCode(session.userId);
  return { recoveryCode };
}

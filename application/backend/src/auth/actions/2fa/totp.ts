import { verifyTOTP } from '@oslojs/otp';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import { getUserTOTPKey, totpBucket, totpUpdateBucket, updateUserTOTPKey } from '../../services/totp';
import { decodeBase64 } from '@oslojs/encoding';
import { ClientError, safeTrySync } from '@acme/utils';
import { setPasswordResetSessionAs2FAVerified } from '../../services/password-reset';
import { getCurrentPasswordResetSession } from '../../services/password-reset';

export async function verifyTotpCode(props: { code: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (!user.registeredTOTP) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  if (!totpBucket.check(user.id, 1)) throw new ClientError('Too many requests');

  if (props.code === '') throw new ClientError('Enter your code');
  if (!totpBucket.consume(user.id, 1)) throw new ClientError('Too many requests');
  const totpKey = await getUserTOTPKey(user.id);
  if (totpKey === null) throw new ClientError('Forbidden');
  if (!verifyTOTP(totpKey, 30, 6, props.code)) throw new ClientError('Invalid code');

  totpBucket.reset(user.id);
  await setSessionAs2FAVerified(session.id);
  return { redirect: '/' };
}

export async function setupTotpCode(props: { encodedKey: string; code: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');

  if (!totpUpdateBucket.check(user.id, 1)) throw new ClientError('Too many requests');

  if (props.code === '') throw new ClientError('Please enter your code');
  if (props.encodedKey.length !== 28) throw new ClientError('Please enter your code');

  const [key] = safeTrySync(() => decodeBase64(props.encodedKey));
  if (key?.byteLength !== 20) throw new ClientError('Invalid key');

  if (!totpUpdateBucket.consume(user.id, 1)) throw new ClientError('Too many requests');
  if (!verifyTOTP(key, 30, 6, props.code)) throw new ClientError('Invalid code');

  await updateUserTOTPKey(session.userId, key);
  await setSessionAs2FAVerified(session.id);

  if (!user.registered2FA) return { redirect: '/recovery-code' };
  return { redirect: '/' };
}

export async function verifyPasswordResetWithTotp(props: { code: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!session.emailVerified) throw new ClientError('Forbidden');
  if (!user.registeredTOTP) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  if (!totpBucket.check(session.userId, 1)) throw new ClientError('Too many requests');

  if (props.code === '') throw new ClientError('Please enter your code');

  const totpKey = await getUserTOTPKey(session.userId);
  if (totpKey === null) throw new ClientError('Forbidden');
  if (!totpBucket.consume(session.userId, 1)) throw new ClientError('Too many requests');
  if (!verifyTOTP(totpKey, 30, 6, props.code)) throw new ClientError('Invalid code');

  totpBucket.reset(session.userId);
  await setPasswordResetSessionAs2FAVerified(session.id);
  return { redirect: '/reset-password' };
}

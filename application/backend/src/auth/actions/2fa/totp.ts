import { verifyTOTP } from '@oslojs/otp';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import { getUserTOTPKey, totpBucket, totpUpdateBucket, updateUserTOTPKey } from '../../services/totp';
import { decodeBase64 } from '@oslojs/encoding';
import { safeTrySync } from '@acme/utils';
import { setPasswordResetSessionAs2FAVerified } from '../../services/password-reset';
import { getCurrentPasswordResetSession } from '../../services/password-reset';

type Result = { message: string } | { redirect: string };

export async function verifyTotpCode(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (!user.registeredTOTP) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  if (!totpBucket.check(user.id, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Enter your code' };
  if (!totpBucket.consume(user.id, 1)) return { message: 'Too many requests' };
  const totpKey = await getUserTOTPKey(user.id);
  if (totpKey === null) return { message: 'Forbidden' };
  if (!verifyTOTP(totpKey, 30, 6, props.code)) return { message: 'Invalid code' };

  totpBucket.reset(user.id);
  await setSessionAs2FAVerified(session.id);
  return { redirect: '/' };
}

export async function setupTotpCode(props: { encodedKey: string; code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (user.registered2FA && !session.twoFactorVerified) return { message: 'Forbidden' };

  if (!totpUpdateBucket.check(user.id, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Please enter your code' };
  if (props.encodedKey.length !== 28) return { message: 'Please enter your code' };

  const [key] = safeTrySync(() => decodeBase64(props.encodedKey));
  if (key === null) return { message: 'Invalid key' };
  if (key.byteLength !== 20) return { message: 'Invalid key' };

  if (!totpUpdateBucket.consume(user.id, 1)) return { message: 'Too many requests' };
  if (!verifyTOTP(key, 30, 6, props.code)) return { message: 'Invalid code' };

  await updateUserTOTPKey(session.userId, key);
  await setSessionAs2FAVerified(session.id);

  if (!user.registered2FA) return { redirect: '/recovery-code' };
  return { redirect: '/' };
}

export async function verifyPasswordResetWithTotp(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) return { message: 'Not authenticated' };
  if (!session.emailVerified) return { message: 'Forbidden' };
  if (!user.registeredTOTP) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  if (!totpBucket.check(session.userId, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Please enter your code' };

  const totpKey = await getUserTOTPKey(session.userId);
  if (totpKey === null) return { message: 'Forbidden' };
  if (!totpBucket.consume(session.userId, 1)) return { message: 'Too many requests' };
  if (!verifyTOTP(totpKey, 30, 6, props.code)) return { message: 'Invalid code' };

  totpBucket.reset(session.userId);
  await setPasswordResetSessionAs2FAVerified(session.id);
  return { redirect: '/reset-password' };
}

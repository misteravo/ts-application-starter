import { verifyTOTP } from '@oslojs/otp';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import { getUserTOTPKey, totpBucket, totpUpdateBucket, updateUserTOTPKey } from '../../services/totp';
import { decodeBase64 } from '@oslojs/encoding';
import { safeTrySync } from '@acme/utils';

type Result = { message: string } | { redirect: string };

export async function verifyTotpCode(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (session === null) return { message: 'Not authenticated' };
  if (!user.emailVerified || !user.registeredTOTP || session.twoFactorVerified) {
    return { message: 'Forbidden' };
  }
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

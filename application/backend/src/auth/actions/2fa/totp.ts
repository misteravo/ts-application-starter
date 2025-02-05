import { verifyTOTP } from '@oslojs/otp';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import { getUserTOTPKey, totpBucket } from '../../services/totp';

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

import { resetUser2FAWithRecoveryCode } from '../../services/2fa';

import { recoveryCodeBucket } from '../../services/2fa';
import { getCurrentSession } from '../../services/session';

type Result = { message: string } | { redirect: string };

export async function reset2FACode(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (session === null) return { message: 'Not authenticated' };
  if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) {
    return { message: 'Forbidden' };
  }

  if (!recoveryCodeBucket.check(user.id, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Please enter your code' };
  if (!recoveryCodeBucket.consume(user.id, 1)) return { message: 'Too many requests' };

  const valid = await resetUser2FAWithRecoveryCode(user.id, props.code);
  if (!valid) return { message: 'Invalid recovery code' };

  recoveryCodeBucket.reset(user.id);
  return { redirect: '/2fa/setup' };
}

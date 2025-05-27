import { resetUser2FAWithRecoveryCode } from '../../services/2fa';

import { recoveryCodeBucket } from '../../services/2fa';
import { getCurrentPasswordResetSession } from '../../services/password-reset';
import { getCurrentSession } from '../../services/session';

type Result = { message: string } | { redirect: string };

export async function reset2FACode(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (!user.registered2FA) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  if (!recoveryCodeBucket.check(user.id, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Please enter your code' };
  if (!recoveryCodeBucket.consume(user.id, 1)) return { message: 'Too many requests' };

  const valid = await resetUser2FAWithRecoveryCode(user.id, props.code);
  if (!valid) return { message: 'Invalid recovery code' };

  recoveryCodeBucket.reset(user.id);
  return { redirect: '/2fa/setup' };
}

export async function verifyPasswordResetWithRecoveryCode(props: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) return { message: 'Not authenticated' };
  if (!session.emailVerified) return { message: 'Forbidden' };
  if (!user.registered2FA) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  if (!recoveryCodeBucket.check(session.userId, 1)) return { message: 'Too many requests' };

  if (props.code === '') return { message: 'Please enter your code' };
  if (!recoveryCodeBucket.consume(session.userId, 1)) return { message: 'Too many requests' };

  const valid = await resetUser2FAWithRecoveryCode(session.userId, props.code);
  if (!valid) return { message: 'Invalid code' };

  recoveryCodeBucket.reset(session.userId);
  return { redirect: '/reset-password' };
}

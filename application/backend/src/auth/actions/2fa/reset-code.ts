import { ClientError } from '@acme/utils';
import { resetUser2FAWithRecoveryCode } from '../../services/2fa';

import { recoveryCodeBucket } from '../../services/2fa';
import { getCurrentPasswordResetSession } from '../../services/password-reset';
import { getCurrentSession } from '../../services/session';

export async function reset2FACode(props: { code: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (!user.registered2FA) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  if (!recoveryCodeBucket.check(user.id, 1)) throw new ClientError('Too many requests');

  if (props.code === '') throw new ClientError('Please enter your code');
  if (!recoveryCodeBucket.consume(user.id, 1)) throw new ClientError('Too many requests');

  const valid = await resetUser2FAWithRecoveryCode(user.id, props.code);
  if (!valid) throw new ClientError('Invalid recovery code');

  recoveryCodeBucket.reset(user.id);
  return { redirect: '/2fa/setup' };
}

export async function verifyPasswordResetWithRecoveryCode(props: { code: string }): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!session.emailVerified) throw new ClientError('Forbidden');
  if (!user.registered2FA) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  if (!recoveryCodeBucket.check(session.userId, 1)) throw new ClientError('Too many requests');

  if (props.code === '') throw new ClientError('Please enter your code');
  if (!recoveryCodeBucket.consume(session.userId, 1)) throw new ClientError('Too many requests');

  const valid = await resetUser2FAWithRecoveryCode(session.userId, props.code);
  if (!valid) throw new ClientError('Invalid code');

  recoveryCodeBucket.reset(session.userId);
  return { redirect: '/reset-password' };
}

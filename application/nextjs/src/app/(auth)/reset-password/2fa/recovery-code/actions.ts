'use server';

import {
  getCurrentPasswordResetSession,
  globalPOSTRateLimit,
  recoveryCodeBucket,
  resetUser2FAWithRecoveryCode,
} from '@acme/backend';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { formAction } from '~/lib/safe-action';

const schema = z.object({
  code: z.string(),
});
export const verifyPasswordReset2FAWithRecoveryCodeAction = formAction(schema, async ({ code }) => {
  if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };

  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) return { message: 'Not authenticated' };
  if (!session.emailVerified) return { message: 'Forbidden' };
  if (!user.registered2FA) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  if (!recoveryCodeBucket.check(session.userId, 1)) return { message: 'Too many requests' };

  if (code === '') return { message: 'Please enter your code' };
  if (!recoveryCodeBucket.consume(session.userId, 1)) return { message: 'Too many requests' };

  const valid = await resetUser2FAWithRecoveryCode(session.userId, code);
  if (!valid) return { message: 'Invalid code' };

  recoveryCodeBucket.reset(session.userId);
  return redirect('/reset-password');
});

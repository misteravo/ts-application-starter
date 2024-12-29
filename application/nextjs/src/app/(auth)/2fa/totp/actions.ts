'use server';

import {
  getCurrentSession,
  getUserTOTPKey,
  globalPOSTRateLimit,
  setSessionAs2FAVerified,
  totpBucket,
} from '@acme/backend';
import { verifyTOTP } from '@oslojs/otp';
import { redirect } from 'next/navigation';

export async function verify2FAAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await globalPOSTRateLimit())) return { message: 'Too many requests' };

  const { session, user } = await getCurrentSession();
  if (session === null) return { message: 'Not authenticated' };
  if (!user.emailVerified || !user.registeredTOTP || session.twoFactorVerified) {
    return {
      message: 'Forbidden',
    };
  }
  if (!totpBucket.check(user.id, 1)) {
    return {
      message: 'Too many requests',
    };
  }

  const code = formData.get('code');
  if (typeof code !== 'string') {
    return {
      message: 'Invalid or missing fields',
    };
  }
  if (code === '') {
    return {
      message: 'Enter your code',
    };
  }
  if (!totpBucket.consume(user.id, 1)) {
    return {
      message: 'Too many requests',
    };
  }
  const totpKey = await getUserTOTPKey(user.id);
  if (totpKey === null) {
    return {
      message: 'Forbidden',
    };
  }
  if (!verifyTOTP(totpKey, 30, 6, code)) {
    return {
      message: 'Invalid code',
    };
  }
  totpBucket.reset(user.id);
  await setSessionAs2FAVerified(session.id);
  return redirect('/');
}

interface ActionResult {
  message: string;
}

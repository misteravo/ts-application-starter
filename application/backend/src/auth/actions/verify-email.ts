'use server';

import {
  createEmailVerificationRequest,
  deleteEmailVerificationRequestCookie,
  deleteUserEmailVerificationRequest,
  getCurrentUserEmailVerificationRequest,
  sendVerificationEmail,
  sendVerificationEmailBucket,
  setEmailVerificationRequestCookie,
} from '../services/email-verification';
import { invalidateUserPasswordResetSessions } from '../services/password-reset';
import { ExpiringTokenBucket } from '../services/rate-limit';
import { getCurrentSession } from '../services/session';
import { updateUserEmailAndSetEmailAsVerified } from '../services/user';

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

type Result = { message: string } | { redirect: string };

export async function verifyEmail({ code }: { code: string }): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (user.registered2FA && !session.twoFactorVerified) return { message: 'Forbidden' };
  if (!bucket.check(user.id, 1)) return { message: 'Too many requests' };

  let verificationRequest = await getCurrentUserEmailVerificationRequest();
  if (!verificationRequest) return { message: 'Not authenticated' };

  if (!code) return { message: 'Enter your code' };
  if (!bucket.consume(user.id, 1)) return { message: 'Too many requests' };

  if (Date.now() >= verificationRequest.expiresAt.getTime()) {
    verificationRequest = await createEmailVerificationRequest(verificationRequest.userId, verificationRequest.email);
    await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
    return { message: 'The verification code was expired. We sent another code to your inbox.' };
  }
  if (verificationRequest.code !== code) return { message: 'Incorrect code.' };

  await deleteUserEmailVerificationRequest(user.id);
  await invalidateUserPasswordResetSessions(user.id);
  await updateUserEmailAndSetEmailAsVerified(user.id, verificationRequest.email);
  await deleteEmailVerificationRequestCookie();

  if (!user.registered2FA) return { redirect: '/2fa/setup' };
  return { redirect: '/' };
}

export async function resendEmailVerificationCode(): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (user.registered2FA && !session.twoFactorVerified) return { message: 'Forbidden' };
  if (!sendVerificationEmailBucket.check(user.id, 1)) return { message: 'Too many requests' };

  let verificationRequest = await getCurrentUserEmailVerificationRequest();
  if (!verificationRequest) {
    if (user.emailVerified) return { message: 'Forbidden' };
    if (!sendVerificationEmailBucket.consume(user.id, 1)) return { message: 'Too many requests' };
    verificationRequest = await createEmailVerificationRequest(user.id, user.email);
  } else {
    if (!sendVerificationEmailBucket.consume(user.id, 1)) return { message: 'Too many requests' };
    verificationRequest = await createEmailVerificationRequest(user.id, verificationRequest.email);
  }

  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  await setEmailVerificationRequestCookie(verificationRequest);
  return { message: 'A new code was sent to your inbox.' };
}

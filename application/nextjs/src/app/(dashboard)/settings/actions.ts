'use server';

import {
  deletePasskey,
  deleteSecurityKey,
  disconnectTOTP,
  getCurrentSession,
  resetUserRecoveryCode,
  updateEmail,
  updatePassword,
} from '@acme/backend';
import { redirect } from 'next/navigation';

import { zfd } from 'zod-form-data';
import { formAction, simpleAction } from '~/lib/safe-action';

const updatePasswordSchema = zfd.formData({
  password: zfd.text(),
  newPassword: zfd.text(),
});
export const updatePasswordAction = formAction(updatePasswordSchema, async ({ password, newPassword }) => {
  return await updatePassword({ password, newPassword });
});

const updateEmailSchema = zfd.formData({
  email: zfd.text(),
});
export const updateEmailAction = formAction(updateEmailSchema, async ({ email }) => {
  const result = await updateEmail({ email });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

export const disconnectTOTPAction = simpleAction(async () => {
  return await disconnectTOTP();
});

const deletePasskeySchema = zfd.formData({
  encodedCredentialId: zfd.text(),
});
export const deletePasskeyAction = formAction(deletePasskeySchema, async ({ encodedCredentialId }) => {
  return await deletePasskey({ encodedCredentialId });
});

const deleteSecurityKeySchema = zfd.formData({
  encodedCredentialId: zfd.text(),
});
export const deleteSecurityKeyAction = formAction(deleteSecurityKeySchema, async ({ encodedCredentialId }) => {
  return await deleteSecurityKey({ encodedCredentialId });
});

export const regenerateRecoveryCodeAction = simpleAction(async () => {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated', recoveryCode: null };
  if (!user.emailVerified) return { message: 'Forbidden', recoveryCode: null };
  if (!session.twoFactorVerified) return { message: 'Forbidden', recoveryCode: null };

  const recoveryCode = await resetUserRecoveryCode(session.userId);
  return { recoveryCode };
});

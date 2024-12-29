'use server';

import { resendEmailVerificationCode, verifyEmail } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const verifyEmailSchema = zfd.formData({
  code: zfd.text(),
});
export const verifyEmailAction = formAction(verifyEmailSchema, async ({ code }) => {
  const result = await verifyEmail({ code });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

export const resendEmailVerificationCodeAction = formAction(zfd.formData({}), async () => {
  const result = await resendEmailVerificationCode();
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

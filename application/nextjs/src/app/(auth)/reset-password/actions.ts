'use server';

import { resetPassword } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const resetPasswordSchema = zfd.formData({
  password: zfd.text(),
});
export const resetPasswordAction = formAction(resetPasswordSchema, async ({ password }) => {
  const result = await resetPassword({ password });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

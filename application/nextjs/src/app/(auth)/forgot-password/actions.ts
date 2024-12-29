'use server';

import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';
import { forgotPassword } from '@acme/backend';

const forgotPasswordSchema = zfd.formData({
  email: zfd.text(),
});
export const forgotPasswordAction = formAction(forgotPasswordSchema, async ({ email }) => {
  const result = await forgotPassword({ email });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

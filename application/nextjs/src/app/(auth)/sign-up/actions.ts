'use server';

import { signUp } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const signUpSchema = zfd.formData({
  username: zfd.text(),
  email: zfd.text(),
  password: zfd.text(),
});
export const signupAction = formAction(signUpSchema, async ({ username, email, password }) => {
  const result = await signUp({ username, email, password });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

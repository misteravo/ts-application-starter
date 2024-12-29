'use server';

import { verifyPasswordResetEmail } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const schema = zfd.formData({
  code: zfd.text(),
});
export const verifyPasswordResetEmailAction = formAction(schema, async ({ code }) => {
  const result = await verifyPasswordResetEmail({ code });
  if ('redirect' in result) redirect(result.redirect);
  return result;
});

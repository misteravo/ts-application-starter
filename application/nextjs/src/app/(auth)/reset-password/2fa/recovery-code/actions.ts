'use server';

import { verifyPasswordResetWithRecoveryCode } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const schema = zfd.formData({
  code: zfd.text(),
});
export const verifyPasswordReset2FAWithRecoveryCodeAction = formAction(schema, async ({ code }) => {
  const result = await verifyPasswordResetWithRecoveryCode({ code });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

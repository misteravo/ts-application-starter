'use server';

import { verifyPasswordResetWithRecoveryCode } from '@acme/backend';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { formAction } from '~/lib/safe-action';

const schema = z.object({
  code: z.string(),
});
export const verifyPasswordReset2FAWithRecoveryCodeAction = formAction(schema, async ({ code }) => {
  const result = await verifyPasswordResetWithRecoveryCode({ code });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

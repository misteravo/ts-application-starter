'use server';

import { reset2FACode } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const schema = zfd.formData({
  code: zfd.text(),
});
export const reset2FAAction = formAction(schema, async ({ code }) => {
  const result = await reset2FACode({ code });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

'use server';

import { setupTotpCode } from '@acme/backend';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const schema = zfd.formData({
  key: zfd.text(),
  code: zfd.text(),
});
export const setupTotpCodeAction = formAction(schema, async ({ key, code }) => {
  const result = await setupTotpCode({ encodedKey: key, code });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

'use server';

import { registerPasskey } from '@acme/backend';
import { safeTrySync } from '@acme/utils';
import { decodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { formAction } from '~/lib/safe-action';

const schema = zfd.formData({
  name: zfd.text(),
  attestationObject: zfd.text(),
  clientDataJSON: zfd.text(),
});
export const registerPasskeyAction = formAction(schema, async ({ name, attestationObject, clientDataJSON }) => {
  const [decoded] = safeTrySync(() => ({
    attestationObject: decodeBase64(attestationObject),
    clientData: decodeBase64(clientDataJSON),
  }));
  if (!decoded) return { message: 'Invalid or missing fields' };

  const result = await registerPasskey({ name, ...decoded });
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

'use server';

import { signIn, signInWithPasskey } from '@acme/backend';
import { safeTrySync } from '@acme/utils';
import { decodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { zfd } from 'zod-form-data';
import { z } from 'zod';
import { formAction, schemaAction } from '~/lib/safe-action';

const signInSchema = zfd.formData({
  email: zfd.text(),
  password: zfd.text(),
});
export const signInAction = formAction(signInSchema, async (props) => {
  const result = await signIn(props);
  redirect(result.redirect);
});

const signInWithPassKeySchema = z.object({
  credentialId: z.string(),
  signature: z.string(),
  authenticatorData: z.string(),
  clientData: z.string(),
});
export const signInWithPasskeyAction = schemaAction(signInWithPassKeySchema, async (props) => {
  const [decoded] = safeTrySync(() => ({
    authenticatorData: decodeBase64(props.authenticatorData),
    clientData: decodeBase64(props.clientData),
    credentialId: decodeBase64(props.credentialId),
    signature: decodeBase64(props.signature),
  }));
  if (!decoded) return { message: 'Invalid or missing fields' };

  const result = await signInWithPasskey(decoded);
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

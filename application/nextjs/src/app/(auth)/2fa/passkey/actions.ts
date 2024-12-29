'use server';

import { decodeBase64 } from '@oslojs/encoding';

import { safeTrySync } from '@acme/utils';
import { z } from 'zod';
import { schemaAction } from '~/lib/safe-action';
import { verify2FAWithPasskey } from '@acme/backend';
import { redirect } from 'next/navigation';

const schema = z.object({
  credentialId: z.string(),
  signature: z.string(),
  authenticatorData: z.string(),
  clientData: z.string(),
});
export const verify2FAWithPasskeyAction = schemaAction(schema, async (props) => {
  const [decoded] = safeTrySync(() => ({
    authenticatorData: decodeBase64(props.authenticatorData),
    clientData: decodeBase64(props.clientData),
    credentialId: decodeBase64(props.credentialId),
    signature: decodeBase64(props.signature),
  }));
  if (!decoded) return { message: 'Invalid or missing fields' };

  const result = await verify2FAWithPasskey(decoded);
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

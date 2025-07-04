'use server';

import { verifyPasskey } from '@acme/backend';
import { safeTrySync } from '@acme/utils';
import { decodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { z } from 'zod/v4';
import { schemaAction } from '~/lib/safe-action';

const schema = z.object({
  credentialId: z.string(),
  signature: z.string(),
  authenticatorData: z.string(),
  clientData: z.string(),
});
export const verifyPasskeyAction = schemaAction(schema, async (props) => {
  const [decoded] = safeTrySync(() => ({
    authenticatorData: decodeBase64(props.authenticatorData),
    clientData: decodeBase64(props.clientData),
    credentialId: decodeBase64(props.credentialId),
    signature: decodeBase64(props.signature),
  }));
  if (!decoded) return { message: 'Invalid or missing fields' };

  const result = await verifyPasskey(decoded);
  if ('redirect' in result) return redirect(result.redirect);
  return result;
});

'use client';

import { Alert, Button } from '@acme/ui';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { verify2FAWithSecurityKeyAction } from './actions';

export function Verify2FAWithSecurityKeyButton(props: { encodedCredentialIds: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');

  async function handleAuthentication() {
    const challenge = await createChallenge();

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'discouraged',
        allowCredentials: props.encodedCredentialIds.map((encoded) => {
          return {
            id: decodeBase64(encoded),
            type: 'public-key',
          };
        }),
      },
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error('Failed to create public key');
    }
    if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
      throw new Error('Unexpected error');
    }

    const result = await verify2FAWithSecurityKeyAction({
      credential_id: encodeBase64(new Uint8Array(credential.rawId)),
      signature: encodeBase64(new Uint8Array(credential.response.signature)),
      authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
      client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON)),
    });

    if (result.error !== null) {
      setMessage(result.error);
    } else {
      router.push('/');
    }
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={() => void handleAuthentication()}>
        Authenticate
      </Button>
      {message && <Alert>{message}</Alert>}
    </div>
  );
}

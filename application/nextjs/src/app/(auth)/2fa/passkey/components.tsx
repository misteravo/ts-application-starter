'use client';

import { Alert, Button } from '@acme/ui'; // Importing Button and Alert from Shadcn
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { verifyPasskeyAction } from './actions';

export function VerifyPasskeyButton(props: { encodedCredentialIds: string[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');

  async function handleAuthentication() {
    const challenge = await createChallenge();

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'discouraged',
        allowCredentials: props.encodedCredentialIds.map((encoded) => ({
          id: decodeBase64(encoded),
          type: 'public-key',
        })),
      },
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error('Failed to create public key');
    }
    if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
      throw new Error('Unexpected error');
    }

    const result = await verifyPasskeyAction({
      credentialId: encodeBase64(new Uint8Array(credential.rawId)),
      signature: encodeBase64(new Uint8Array(credential.response.signature)),
      authenticatorData: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
      clientData: encodeBase64(new Uint8Array(credential.response.clientDataJSON)),
    });

    if ('message' in result) {
      setMessage(result.message);
    } else {
      router.push('/');
    }
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={handleAuthentication}>
        Authenticate
      </Button>
      {message && <Alert variant="destructive">{message}</Alert>}
    </div>
  );
}

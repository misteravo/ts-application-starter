'use client';

import type { User } from '@acme/backend';
import { Alert, Button, Input, Label } from '@acme/ui';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { useActionState, useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { registerPasskeyAction } from './actions';

const initialRegisterPasskeyState = {
  message: '',
};

export function RegisterPasskeyForm(props: {
  encodedCredentialUserId: string;
  user: User;
  encodedCredentialIds: string[];
}) {
  const [encodedAttestationObject, setEncodedAttestationObject] = useState<string | null>(null);
  const [encodedClientDataJSON, setEncodedClientDataJSON] = useState<string | null>(null);
  const [formState, action] = useActionState(registerPasskeyAction, initialRegisterPasskeyState);

  async function handleCreateCredential() {
    const challenge = await createChallenge();
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        user: {
          displayName: props.user.username,
          id: decodeBase64(props.encodedCredentialUserId),
          name: props.user.email,
        },
        rp: {
          name: 'Next.js WebAuthn example',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        attestation: 'none',
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'required',
          requireResidentKey: true,
        },
        excludeCredentials: props.encodedCredentialIds.map((encoded) => ({
          id: decodeBase64(encoded),
          type: 'public-key',
        })),
      },
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error('Failed to create public key');
    }
    if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
      throw new Error('Unexpected error');
    }

    setEncodedAttestationObject(encodeBase64(new Uint8Array(credential.response.attestationObject)));
    setEncodedClientDataJSON(encodeBase64(new Uint8Array(credential.response.clientDataJSON)));
  }

  return (
    <div className="space-y-4">
      <Button
        disabled={encodedAttestationObject !== null && encodedClientDataJSON !== null}
        onClick={() => void handleCreateCredential()}
      >
        Create credential
      </Button>
      <form action={action} className="space-y-4">
        <Label htmlFor="form-register-credential.name">Credential name</Label>
        <Input id="form-register-credential.name" name="name" required />
        <input type="hidden" name="attestationObject" value={encodedAttestationObject ?? ''} />
        <input type="hidden" name="clientDataJSON" value={encodedClientDataJSON ?? ''} />
        <Button disabled={encodedAttestationObject === null && encodedClientDataJSON === null}>Continue</Button>
        {formState.message && <Alert>{formState.message}</Alert>}
      </form>
    </div>
  );
}

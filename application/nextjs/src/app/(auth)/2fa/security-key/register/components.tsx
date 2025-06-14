'use client';

import type { User } from '@acme/backend';
import { Alert, Button, Input, Label } from '@acme/ui'; // Assuming these components are available from Shadcn
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { useActionState, useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { registerSecurityKeyAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialRegisterSecurityKeyState = {
  message: '',
};

export function RegisterSecurityKey(props: {
  encodedCredentialUserId: string;
  user: User;
  encodedCredentialIds: string[];
}) {
  const [encodedAttestationObject, setEncodedAttestationObject] = useState<string | null>(null);
  const [encodedClientDataJSON, setEncodedClientDataJSON] = useState<string | null>(null);
  const [formState, action] = useActionState(registerSecurityKeyAction, initialRegisterSecurityKeyState);
  const tr = useTranslate(translations);

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
          userVerification: 'discouraged',
          residentKey: 'discouraged',
          requireResidentKey: false,
          authenticatorAttachment: 'cross-platform',
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
        {tr('Create credential')}
      </Button>
      <form action={action} className="space-y-4">
        <Label htmlFor="form-register-credential.name">{tr('Credential name')}</Label>
        <Input id="form-register-credential.name" name="name" required />
        <input type="hidden" name="attestationObject" value={encodedAttestationObject ?? ''} />
        <input type="hidden" name="clientDataJSON" value={encodedClientDataJSON ?? ''} />
        <Button disabled={encodedAttestationObject === null && encodedClientDataJSON === null}>{tr('Continue')}</Button>
        {formState.message && <Alert variant="destructive">{formState.message}</Alert>}
      </form>
    </div>
  );
}

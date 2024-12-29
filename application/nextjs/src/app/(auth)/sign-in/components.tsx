'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { KeyRound } from 'lucide-react';
import { Link } from '~/components/link';
import { useActionState, useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { signInAction, signInWithPasskeyAction } from './actions';

const initialState = {
  message: '',
};

export function LoginForm() {
  const [state, action] = useActionState(signInAction, initialState);

  return (
    <form action={action}>
      <div className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="form-login.email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="forgot-password" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="form-login.password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        <PasskeyLoginButton />
        {state.message && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </form>
  );
}

export function PasskeyLoginButton() {
  const [message, setMessage] = useState('');

  async function handleLogin() {
    const challenge = await createChallenge();

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
      },
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error('Failed to create public key');
    }
    if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
      throw new Error('Unexpected error');
    }

    const result = await signInWithPasskeyAction({
      credentialId: encodeBase64(new Uint8Array(credential.rawId)),
      signature: encodeBase64(new Uint8Array(credential.response.signature)),
      authenticatorData: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
      clientData: encodeBase64(new Uint8Array(credential.response.clientDataJSON)),
    });
    setMessage(result.message);
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => void handleLogin()} className="w-full">
        <KeyRound /> Sign in with passkey
      </Button>
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

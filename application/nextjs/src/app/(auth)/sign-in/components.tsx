'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { Loader2, Eye, EyeOff, Mail, Lock, Fingerprint } from 'lucide-react';
import { Link } from '~/components/link';
import { useActionState, useState } from 'react';
import { createChallenge } from '~/lib/webauthn';
import { signInAction, signInWithPasskeyAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialState = {
  message: '',
};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center text-sm font-medium">
            <Mail className="mr-2 h-4 w-4" />
            {tr('Email')}
          </Label>
          <Input
            id="form-login.email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder={tr('Enter your email address')}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="flex items-center text-sm font-medium">
              <Lock className="mr-2 h-4 w-4" />
              {tr('Password')}
            </Label>
            <Link
              href="forgot-password"
              className="hover:text-primary/80 text-sm text-primary underline-offset-4 hover:underline"
            >
              {tr('Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="form-login.password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={tr('Enter your password')}
              className="h-11 pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tr('Signing in...')}
            </>
          ) : (
            tr('Sign in')
          )}
        </Button>

        <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{tr('Or')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

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
  const [isLoading, setIsLoading] = useState(false);
  const tr = useTranslate(translations);

  async function handleLogin() {
    setIsLoading(true);
    setMessage('');

    try {
      const challenge = await createChallenge();

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge as BufferSource,
          userVerification: 'required',
        },
      });

      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error(tr('Failed to create public key'));
      }
      if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
        throw new Error(tr('Unexpected error'));
      }

      const result = await signInWithPasskeyAction({
        credentialId: encodeBase64(new Uint8Array(credential.rawId)),
        signature: encodeBase64(new Uint8Array(credential.response.signature)),
        authenticatorData: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
        clientData: encodeBase64(new Uint8Array(credential.response.clientDataJSON)),
      });
      setMessage(result.message);
    } catch {
      setMessage(tr('Failed to sign in with passkey. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => void handleLogin()}
        disabled={isLoading}
        className="hover:bg-muted/50 h-11 w-full border-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tr('Authenticating...')}
          </>
        ) : (
          <>
            <Fingerprint className="mr-2 h-4 w-4" />
            {tr('Sign in with passkey')}
          </>
        )}
      </Button>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

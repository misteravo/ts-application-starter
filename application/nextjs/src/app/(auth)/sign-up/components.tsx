'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { signupAction } from './actions';
import { useTranslate } from '@acme/i18n/react';
import { translations } from './translations';

const initialState = {
  message: '',
};

export function SignUpForm() {
  const [state, action] = useActionState(signupAction, initialState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-signup.username">{tr('Username')}</Label>
        <Input
          id="form-signup.username"
          name="username"
          required
          minLength={4}
          maxLength={31}
          placeholder={tr('Enter your username')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-signup.email">{tr('Email')}</Label>
        <Input
          type="email"
          id="form-signup.email"
          name="email"
          autoComplete="username"
          required
          placeholder={tr('Enter your email')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-signup.password">{tr('Password')}</Label>
        <Input
          type="password"
          id="form-signup.password"
          name="password"
          autoComplete="new-password"
          required
          placeholder={tr('Create a password')}
        />
      </div>
      <Button type="submit" className="w-full">
        {tr('Create Account')}
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

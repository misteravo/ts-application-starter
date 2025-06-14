'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { forgotPasswordAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialForgotPasswordState = {
  message: '',
};

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialForgotPasswordState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-forgot.email">{tr('Email')}</Label>
        <Input type="email" id="form-forgot.email" name="email" placeholder={tr('Enter your email address')} required />
      </div>
      <Button type="submit" className="w-full">
        {tr('Send Reset Link')}
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

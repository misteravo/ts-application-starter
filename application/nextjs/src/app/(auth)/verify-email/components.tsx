'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { resendEmailVerificationCodeAction, verifyEmailAction } from './actions';
import { useTranslate } from '@acme/i18n/react';
import { translations } from './translations';

const emailVerificationInitialState = {
  message: '',
};

export function EmailVerificationForm() {
  const [state, action] = useActionState(verifyEmailAction, emailVerificationInitialState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-verify.code">{tr('Verification Code')}</Label>
        <Input id="form-verify.code" name="code" placeholder={tr('Enter 8-digit code')} required />
      </div>
      <Button type="submit" className="w-full">
        {tr('Verify Email')}
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

const resendEmailInitialState = {
  message: '',
};

export function ResendEmailVerificationCodeForm() {
  const [state, action] = useActionState(resendEmailVerificationCodeAction, resendEmailInitialState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <Button type="submit" variant="outline" className="w-full">
        {tr('Resend verification code')}
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

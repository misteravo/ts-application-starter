'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { resendEmailVerificationCodeAction, verifyEmailAction } from './actions';

const emailVerificationInitialState = {
  message: '',
};

export function EmailVerificationForm() {
  const [state, action] = useActionState(verifyEmailAction, emailVerificationInitialState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-verify.code">Verification Code</Label>
        <Input id="form-verify.code" name="code" placeholder="Enter 8-digit code" required />
      </div>
      <Button type="submit" className="w-full">
        Verify Email
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
  return (
    <form action={action} className="space-y-4">
      <Button type="submit" variant="outline" className="w-full">
        Resend verification code
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

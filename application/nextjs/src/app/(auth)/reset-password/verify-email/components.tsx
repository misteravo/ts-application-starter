'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { verifyPasswordResetEmailAction } from './actions';

const initialPasswordResetEmailVerificationState = {
  message: '',
};

export function PasswordResetEmailVerificationForm() {
  const [state, action] = useActionState(verifyPasswordResetEmailAction, initialPasswordResetEmailVerificationState);

  return (
    <form action={action} className="space-y-4">
      <Label htmlFor="form-verify.code">Code</Label>
      <Input id="form-verify.code" name="code" required />
      <Button type="submit">Verify</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

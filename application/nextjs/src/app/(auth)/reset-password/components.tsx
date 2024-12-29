'use client';

import { Alert, Button, Input, Label } from '@acme/ui'; // Assuming these components are available from Shadcn
import { useActionState } from 'react';
import { resetPasswordAction } from './actions';

const initialPasswordResetState = {
  message: '',
};

export function PasswordResetForm() {
  const [state, action] = useActionState(resetPasswordAction, initialPasswordResetState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-reset.password">Password</Label>
        <Input type="password" id="form-reset.password" name="password" autoComplete="new-password" required />
      </div>
      <Button type="submit">Reset password</Button>
      {state.message && <Alert variant="destructive">{state.message}</Alert>}
    </form>
  );
}

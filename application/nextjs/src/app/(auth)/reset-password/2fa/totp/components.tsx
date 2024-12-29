'use client';

import { Alert, Button, Input, Label } from '@acme/ui'; // Assuming these components are available from Shadcn
import { useActionState } from 'react';
import { verifyPasswordReset2FAWithTOTPAction } from './actions';

const initialPasswordResetTOTPState = {
  message: '',
};

export function PasswordResetTOTPForm() {
  const [state, action] = useActionState(verifyPasswordReset2FAWithTOTPAction, initialPasswordResetTOTPState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-totp.code">Code</Label>
        <Input id="form-totp.code" name="code" required />
      </div>
      <Button type="submit">Verify</Button>
      {state.message && <Alert variant="destructive">{state.message}</Alert>}
    </form>
  );
}

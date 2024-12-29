'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { verifyPasswordReset2FAWithRecoveryCodeAction } from './actions';

const initialPasswordResetRecoveryCodeState = {
  message: '',
};

export function PasswordResetRecoveryCodeForm() {
  const [state, action] = useActionState(
    verifyPasswordReset2FAWithRecoveryCodeAction,
    initialPasswordResetRecoveryCodeState,
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-recovery-code.code">Recovery code</Label>
        <Input id="form-recovery-code.code" name="code" required />
      </div>
      <Button type="submit">Verify</Button>
      {state.message && <Alert variant="destructive">{state.message}</Alert>}
    </form>
  );
}

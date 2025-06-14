'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { verifyPasswordReset2FAWithRecoveryCodeAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialPasswordResetRecoveryCodeState = {
  message: '',
};

export function PasswordResetRecoveryCodeForm() {
  const [state, action] = useActionState(
    verifyPasswordReset2FAWithRecoveryCodeAction,
    initialPasswordResetRecoveryCodeState,
  );
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-recovery-code.code">{tr('Recovery code')}</Label>
        <Input id="form-recovery-code.code" name="code" required />
      </div>
      <Button type="submit">{tr('Verify')}</Button>
      {state.message && <Alert variant="destructive">{state.message}</Alert>}
    </form>
  );
}

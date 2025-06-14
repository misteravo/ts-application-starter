'use client';

import { Alert, Button, Input, Label } from '@acme/ui'; // Assuming these components are available from Shadcn
import { useActionState } from 'react';
import { verifyPasswordReset2FAWithTOTPAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialPasswordResetTOTPState = {
  message: '',
};

export function PasswordResetTOTPForm() {
  const [state, action] = useActionState(verifyPasswordReset2FAWithTOTPAction, initialPasswordResetTOTPState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-totp.code">{tr('Code')}</Label>
        <Input id="form-totp.code" name="code" required />
      </div>
      <Button type="submit">{tr('Verify')}</Button>
      {state.message && <Alert variant="destructive">{state.message}</Alert>}
    </form>
  );
}

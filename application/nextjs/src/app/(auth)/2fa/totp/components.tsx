'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { verifyTotpCodeAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initial2FAVerificationState = {
  message: '',
};

export function TotpVerificationForm() {
  const [state, action] = useActionState(verifyTotpCodeAction, initial2FAVerificationState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-totp.code">{tr('Code')}</Label>
        <Input id="form-totp.code" name="code" autoComplete="one-time-code" required />
      </div>
      <Button type="submit">{tr('Verify')}</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

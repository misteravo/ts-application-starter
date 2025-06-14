'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { reset2FAAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initial2FAResetState = {
  message: '',
};

export function TwoFactorResetForm() {
  const [state, action] = useActionState(reset2FAAction, initial2FAResetState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-totp.code">{tr('Recovery code')}</Label>
        <Input id="form-totp.code" name="code" required />
      </div>
      <Button type="submit">{tr('Verify')}</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

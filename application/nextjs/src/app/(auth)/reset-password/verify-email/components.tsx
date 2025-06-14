'use client';

import { Alert, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { verifyPasswordResetEmailAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initialPasswordResetEmailVerificationState = {
  message: '',
};

export function PasswordResetEmailVerificationForm() {
  const [state, action] = useActionState(verifyPasswordResetEmailAction, initialPasswordResetEmailVerificationState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <Label htmlFor="form-verify.code">{tr('Code')}</Label>
      <Input id="form-verify.code" name="code" required />
      <Button type="submit">{tr('Verify')}</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

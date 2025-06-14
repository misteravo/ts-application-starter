'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState } from 'react';
import { setupTotpCodeAction } from './actions';
import { translations } from './translations';
import { useTranslate } from '@acme/i18n/react';

const initial2FASetUpState = {
  message: '',
};

export function TwoFactorSetUpForm(props: { encodedTOTPKey: string }) {
  const [state, action] = useActionState(setupTotpCodeAction, initial2FASetUpState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <input name="key" value={props.encodedTOTPKey} type="hidden" required />
      <div className="space-y-2">
        <Label htmlFor="form-totp.code">{tr('Verify the code from the app')}</Label>
        <Input
          id="form-totp.code"
          name="code"
          placeholder={tr('Enter the 6-digit code')}
          required
          pattern="[0-9]{6}"
          maxLength={6}
        />
      </div>
      <Button type="submit" className="w-full">
        {tr('Save')}
      </Button>
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

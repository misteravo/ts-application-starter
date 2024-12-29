'use client';

import { Alert, Button, Input, Label } from '@acme/ui'; // Assuming these components are available from Shadcn
import { useActionState, useState } from 'react';
import {
  deletePasskeyAction,
  deleteSecurityKeyAction,
  disconnectTOTPAction,
  regenerateRecoveryCodeAction,
  updateEmailAction,
  updatePasswordAction,
} from './actions';

const initialUpdatePasswordState = {
  message: '',
};

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialUpdatePasswordState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-password.password">Current password</Label>
        <Input type="password" id="form-password.password" name="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="form-password.new-password">New password</Label>
        <Input
          type="password"
          id="form-password.new-password"
          name="new_password"
          autoComplete="new-password"
          required
        />
      </div>
      <Button type="submit">Update</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

const initialUpdateFormState = {
  message: '',
};

export function UpdateEmailForm() {
  const [state, action] = useActionState(updateEmailAction, initialUpdateFormState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="form-email.email">New email</Label>
        <Input type="email" id="form-email.email" name="email" required />
      </div>
      <Button type="submit">Update</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

const initialDisconnectTOTPState = {
  message: '',
};

export function DisconnectTOTPButton() {
  const [state, formAction] = useActionState(disconnectTOTPAction, initialDisconnectTOTPState);
  return (
    <form action={formAction}>
      <Button type="submit">Disconnect</Button>
      {state.message && <Alert>{state.message}</Alert>}
    </form>
  );
}

const initialPasskeyState = {
  message: '',
};

export function PasskeyCredentialListItem(props: { encodedId: string; name: string }) {
  const [state, formAction] = useActionState(deletePasskeyAction, initialPasskeyState);
  return (
    <div className="flex items-center justify-between">
      <p>{props.name}</p>
      <form action={formAction}>
        <input type="hidden" name="credential_id" value={props.encodedId} />
        <Button type="submit">Delete</Button>
        {state.message && <Alert>{state.message}</Alert>}
      </form>
    </div>
  );
}

const initialSecurityKeyState = {
  message: '',
};

export function SecurityKeyCredentialListItem(props: { encodedId: string; name: string }) {
  const [state, formAction] = useActionState(deleteSecurityKeyAction, initialSecurityKeyState);
  return (
    <div className="flex items-center justify-between">
      <p>{props.name}</p>
      <form action={formAction}>
        <input type="hidden" name="credential_id" value={props.encodedId} />
        <Button type="submit">Delete</Button>
        {state.message && <Alert>{state.message}</Alert>}
      </form>
    </div>
  );
}

export function RecoveryCodeSection(props: { recoveryCode: string }) {
  const [recoveryCode, setRecoveryCode] = useState(props.recoveryCode);

  async function handleGenerateNewCode() {
    const result = await regenerateRecoveryCodeAction();
    if (result.recoveryCode !== null) {
      setRecoveryCode(result.recoveryCode);
    }
  }

  return (
    <div className="space-y-4">
      <h1>Recovery code</h1>
      <p>
        Your recovery code is: <strong>{recoveryCode}</strong>
      </p>
      <Button onClick={() => void handleGenerateNewCode()}>Generate new code</Button>
    </div>
  );
}

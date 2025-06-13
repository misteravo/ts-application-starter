'use client';

import { Alert, AlertDescription, Button, Input, Label } from '@acme/ui';
import { useActionState, useState } from 'react';
import { Loader2, Trash2, Key, Shield, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import {
  deletePasskeyAction,
  deleteSecurityKeyAction,
  disconnectTOTPAction,
  regenerateRecoveryCodeAction,
  updateEmailAction,
  updatePasswordAction,
} from './actions';
import { useTranslate } from '@acme/i18n/react';
import { translations } from './translations';

const initialUpdatePasswordState = {
  message: '',
};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialUpdatePasswordState);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-password.password" className="text-sm font-medium">
          {tr('Current password')}
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            id="form-password.password"
            name="password"
            autoComplete="current-password"
            className="pr-10"
            placeholder={tr('Enter current password')}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-password.new-password" className="text-sm font-medium">
          {tr('New password')}
        </Label>
        <div className="relative">
          <Input
            type={showNewPassword ? 'text' : 'password'}
            id="form-password.new-password"
            name="newPassword"
            autoComplete="new-password"
            className="pr-10"
            placeholder={tr('Enter new password')}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tr('Updating...')}
          </>
        ) : (
          tr('Change Password')
        )}
      </Button>
      {state.message && (
        <Alert variant={state.message.includes('success') ? 'default' : 'destructive'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

const initialUpdateFormState = {
  message: '',
};

export function UpdateEmailForm() {
  const [state, action, pending] = useActionState(updateEmailAction, initialUpdateFormState);
  const tr = useTranslate(translations);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-email.email" className="text-sm font-medium">
          {tr('New email')}
        </Label>
        <Input type="email" id="form-email.email" name="email" placeholder={tr('Enter new email')} required />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tr('Updating...')}
          </>
        ) : (
          tr('Update Email')
        )}
      </Button>
      {state.message && (
        <Alert variant={state.message.includes('success') ? 'default' : 'destructive'}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

const initialDisconnectTOTPState = {
  message: '',
};

export function DisconnectTOTPButton() {
  const [state, formAction, pending] = useActionState(disconnectTOTPAction, initialDisconnectTOTPState);
  const tr = useTranslate(translations);

  return (
    <form action={formAction}>
      <Button type="submit" variant="destructive" size="sm" disabled={pending} className="text-xs">
        {pending ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            {tr('Disconnecting...')}
          </>
        ) : (
          <>
            <Trash2 className="mr-1 h-3 w-3" />
            {tr('Disconnect')}
          </>
        )}
      </Button>
      {state.message && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

const initialPasskeyState = {
  message: '',
};

export function PasskeyCredentialListItem(props: { encodedId: string; name: string }) {
  const [state, formAction, pending] = useActionState(deletePasskeyAction, initialPasskeyState);
  const tr = useTranslate(translations);

  return (
    <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <Key className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium">{props.name}</p>
          <p className="text-xs text-muted-foreground">{tr('Passkeys')}</p>
        </div>
      </div>
      <form action={formAction}>
        <input type="hidden" name="encodedCredentialId" value={props.encodedId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="hover:bg-destructive/10 text-destructive hover:text-destructive"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </form>
      {state.message && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

const initialSecurityKeyState = {
  message: '',
};

export function SecurityKeyCredentialListItem(props: { encodedId: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteSecurityKeyAction, initialSecurityKeyState);
  const tr = useTranslate(translations);

  return (
    <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
          <Shield className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-medium">{props.name}</p>
          <p className="text-xs text-muted-foreground">{tr('Security Keys')}</p>
        </div>
      </div>
      <form action={formAction}>
        <input type="hidden" name="encodedCredentialId" value={props.encodedId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="hover:bg-destructive/10 text-destructive hover:text-destructive"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </form>
      {state.message && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function RecoveryCodeSection(props: { recoveryCode: string }) {
  const [recoveryCode, setRecoveryCode] = useState(props.recoveryCode);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const tr = useTranslate(translations);

  async function handleGenerateNewCode() {
    setIsGenerating(true);
    try {
      const result = await regenerateRecoveryCodeAction();
      if ('recoveryCode' in result && result.recoveryCode) {
        setRecoveryCode(result.recoveryCode);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">{tr('Recovery Codes')}</h3>
      </div>

      <Alert className="border-orange-200 bg-orange-50 text-orange-800">
        <AlertDescription>
          <strong>Important:</strong> Store this recovery code in a safe place. You can use it to access your account if
          you lose access to your other authentication methods.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Your recovery code:</Label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 rounded-lg border bg-background p-3">
            <code className="break-all font-mono text-sm">{recoveryCode}</code>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyToClipboard()} disabled={copied}>
            {copied ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={() => void handleGenerateNewCode()}
          variant="secondary"
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New Recovery Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

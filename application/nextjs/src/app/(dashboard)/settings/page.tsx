import { Link } from '~/components/link';
import {
  DisconnectTOTPButton,
  PasskeyCredentialListItem,
  RecoveryCodeSection,
  SecurityKeyCredentialListItem,
  UpdateEmailForm,
  UpdatePasswordForm,
} from './components';

import {
  get2FARedirect,
  getCurrentSession,
  getUserPasskeyCredentials,
  getUserRecoverCode,
  getUserSecurityKeyCredentials,
  globalGETRateLimit,
} from '@acme/backend';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return 'Too many requests';
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect('/sign-in');
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect(get2FARedirect(user));
  }

  let recoveryCode: string | null = null;
  if (user.registered2FA) {
    recoveryCode = await getUserRecoverCode(user.id);
  }

  const passkeyCredentials = await getUserPasskeyCredentials(user.id);
  const securityKeyCredentials = await getUserSecurityKeyCredentials(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Update Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your email: {user.email}</p>
          <UpdateEmailForm />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Authenticator App</CardTitle>
        </CardHeader>
        <CardContent>
          {user.registeredTOTP ? (
            <>
              <Link href="/2fa/totp/setup" className="text-blue-500 hover:underline">
                Update TOTP
              </Link>
              <DisconnectTOTPButton />
            </>
          ) : (
            <Link href="/2fa/totp/setup" className="text-blue-500 hover:underline">
              Set up TOTP
            </Link>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Passkeys are WebAuthn credentials that validate your identity using your device.</p>
          <ul>
            {passkeyCredentials.map((credential) => (
              <PasskeyCredentialListItem
                encodedId={encodeBase64(credential.id)}
                name={credential.name}
                key={encodeBase64(credential.id)}
              />
            ))}
          </ul>
          <Link href="/2fa/passkey/register" className="text-blue-500 hover:underline">
            Add
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Security Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Security keys are WebAuthn credentials that can only be used for two-factor authentication.</p>
          <ul>
            {securityKeyCredentials.map((credential) => (
              <SecurityKeyCredentialListItem
                encodedId={encodeBase64(credential.id)}
                name={credential.name}
                key={encodeBase64(credential.id)}
              />
            ))}
          </ul>
          <Link href="/2fa/security-key/register" className="text-blue-500 hover:underline">
            Add
          </Link>
        </CardContent>
      </Card>

      {recoveryCode !== null && <RecoveryCodeSection recoveryCode={recoveryCode} />}
    </div>
  );
}

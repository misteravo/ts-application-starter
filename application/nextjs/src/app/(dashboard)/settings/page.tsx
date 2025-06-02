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
import { Avatar, AvatarFallback, Card, CardContent, CardHeader, CardTitle, Separator } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Mail, Lock, Shield, Key, Smartphone, Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (user.registered2FA && !session.twoFactorVerified) return redirect(get2FARedirect(user));

  let recoveryCode: string | null = null;
  if (user.registered2FA) recoveryCode = await getUserRecoverCode(user.id);

  const passkeyCredentials = await getUserPasskeyCredentials(user.id);
  const securityKeyCredentials = await getUserSecurityKeyCredentials(user.id);

  // Get user initials for avatar
  const initials =
    user.email
      .split('@')[0]
      ?.split(/[^a-zA-Z]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') ?? '';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and security preferences.</p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{user.email}</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {user.registered2FA ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.registered2FA ? '2FA Enabled' : '2FA Disabled'}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <Lock className="mr-2 h-5 w-5" />
              Account Security
            </h2>

            {/* Update Email */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Verified</span>
                </div>
                <UpdateEmailForm />
              </CardContent>
            </Card>

            {/* Update Password */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Key className="mr-2 h-4 w-4" />
                  Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpdatePasswordForm />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <Shield className="mr-2 h-5 w-5" />
              Two-Factor Authentication
            </h2>

            {/* Authenticator App */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Authenticator App
                  </div>
                  {user.registeredTOTP && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Active</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app to generate secure verification codes.
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.registeredTOTP ? (
                    <>
                      <Link
                        href="/2fa/totp/setup"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Key className="h-3 w-3" />
                        Update TOTP
                      </Link>
                      <DisconnectTOTPButton />
                    </>
                  ) : (
                    <Link
                      href="/2fa/totp/setup"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Set up TOTP
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Passkeys */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center">
                    <Key className="mr-2 h-4 w-4" />
                    Passkeys
                  </div>
                  {passkeyCredentials.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      {passkeyCredentials.length} Active
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Passkeys are WebAuthn credentials that validate your identity using your device.
                </p>
                {passkeyCredentials.length > 0 ? (
                  <div className="space-y-2">
                    {passkeyCredentials.map((credential) => (
                      <PasskeyCredentialListItem
                        encodedId={encodeBase64(credential.id)}
                        name={credential.name}
                        key={encodeBase64(credential.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed py-4 text-center">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No passkeys configured</p>
                  </div>
                )}
                <Link
                  href="/2fa/passkey/register"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add Passkey
                </Link>
              </CardContent>
            </Card>

            {/* Security Keys */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Keys
                  </div>
                  {securityKeyCredentials.length > 0 && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                      {securityKeyCredentials.length} Active
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Security keys are WebAuthn credentials that can only be used for two-factor authentication.
                </p>
                {securityKeyCredentials.length > 0 ? (
                  <div className="space-y-2">
                    {securityKeyCredentials.map((credential) => (
                      <SecurityKeyCredentialListItem
                        encodedId={encodeBase64(credential.id)}
                        name={credential.name}
                        key={encodeBase64(credential.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed py-4 text-center">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No security keys configured</p>
                  </div>
                )}
                <Link
                  href="/2fa/security-key/register"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add Security Key
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recovery Code Section */}
      {recoveryCode !== null && (
        <Card className="border-orange-200 bg-orange-50/50">
          <RecoveryCodeSection recoveryCode={recoveryCode} />
        </Card>
      )}
    </div>
  );
}

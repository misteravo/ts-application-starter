import {
  getCurrentPasswordResetSession,
  getPasswordReset2FARedirect,
  getUserPasskeyCredentials,
  globalGETRateLimit,
} from '@acme/backend';
import { CardContent, CardFooter, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { AuthTitle } from '~/components/auth-title';
import { VerifyPasskeyButton } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentPasswordResetSession();

  if (!session) return redirect('/forgot-password');
  if (!session.emailVerified) return redirect('/reset-password/verify-email');
  if (!user.registered2FA) return redirect('/reset-password');
  if (session.twoFactorVerified) return redirect('/reset-password');
  if (!user.registeredPasskey) return redirect(getPasswordReset2FARedirect(user));

  const credentials = await getUserPasskeyCredentials(user.id);

  return (
    <>
      <CardHeader>
        <AuthTitle>Authenticate with passkeys</AuthTitle>
      </CardHeader>
      <CardContent>
        <VerifyPasskeyButton encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/reset-password/2fa/recovery-code" className="text-blue-500">
          Use recovery code
        </Link>
        {user.registeredTOTP && (
          <Link href="/reset-password/2fa/totp" className="text-blue-500">
            Use authenticator apps
          </Link>
        )}
        {user.registeredSecurityKey && (
          <Link href="/reset-password/2fa/security-key" className="text-blue-500">
            Use security keys
          </Link>
        )}
      </CardFooter>
    </>
  );
}

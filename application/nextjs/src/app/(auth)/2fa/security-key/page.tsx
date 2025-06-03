import { get2FARedirect, getCurrentSession, getUserSecurityKeyCredentials, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { AuthTitle } from '~/components/auth-title';
import { VerifySecurityKeyButton } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/');
  if (session.twoFactorVerified) return redirect('/');
  if (!user.registeredSecurityKey) return redirect(get2FARedirect(user));

  const credentials = await getUserSecurityKeyCredentials(user.id);

  return (
    <>
      <CardHeader>
        <AuthTitle>Authenticate with Security Keys</AuthTitle>
      </CardHeader>
      <CardContent>
        <VerifySecurityKeyButton encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))} />
        <div className="space-y-2">
          <Link href="/2fa/reset">
            <Button variant="outline" className="mt-2 w-full">
              Use recovery code
            </Button>
          </Link>
          {user.registeredTOTP && (
            <Link href="/2fa/totp">
              <Button variant="outline" className="mt-2 w-full">
                Use authenticator apps
              </Button>
            </Link>
          )}
          {user.registeredPasskey && (
            <Link href="/2fa/passkey">
              <Button variant="outline" className="mt-2 w-full">
                Use passkeys
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </>
  );
}

import { get2FARedirect, getCurrentSession, getUserPasskeyCredentials, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardFooter, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';
import { Verify2FAWithPasskeyButton } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return 'Too many requests';
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect('/sign-in');
  }
  if (!user.emailVerified) {
    return redirect('/verify-email');
  }
  if (!user.registered2FA) {
    return redirect('/');
  }
  if (session.twoFactorVerified) {
    return redirect('/');
  }
  if (!user.registeredPasskey) {
    return redirect(get2FARedirect(user));
  }
  const credentials = await getUserPasskeyCredentials(user.id);

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Authenticate with passkeys</AuthTitle>
      </CardHeader>
      <CardContent>
        <Verify2FAWithPasskeyButton
          encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/2fa/reset">
          <Button variant="link">Use recovery code</Button>
        </Link>
        {user.registeredTOTP && (
          <Link href="/2fa/totp">
            <Button variant="link">Use authenticator apps</Button>
          </Link>
        )}
        {user.registeredSecurityKey && (
          <Link href="/2fa/security-key">
            <Button variant="link">Use security keys</Button>
          </Link>
        )}
      </CardFooter>
    </AuthLayout>
  );
}

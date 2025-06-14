import { get2FARedirect, getCurrentSession, getUserPasskeyCredentials, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardFooter, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { VerifyPasskeyButton } from './components';
import { AuthTitle } from '~/components/auth-title';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/');
  if (session.twoFactorVerified) return redirect('/');
  if (!user.registeredPasskey) return redirect(get2FARedirect(user));

  const credentials = await getUserPasskeyCredentials(user.id);

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Authenticate with passkeys')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <VerifyPasskeyButton encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/2fa/reset">
          <Button variant="link">{tr('Use recovery code')}</Button>
        </Link>
        {user.registeredTOTP && (
          <Link href="/2fa/totp">
            <Button variant="link">{tr('Use authenticator apps')}</Button>
          </Link>
        )}
        {user.registeredSecurityKey && (
          <Link href="/2fa/security-key">
            <Button variant="link">{tr('Use security keys')}</Button>
          </Link>
        )}
      </CardFooter>
    </>
  );
}

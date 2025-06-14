import { Button, CardContent, CardFooter, CardHeader } from '@acme/ui';
import { PasswordResetTOTPForm } from './components';
import { getCurrentPasswordResetSession, getPasswordReset2FARedirect, globalGETRateLimit } from '@acme/backend';
import { Link } from '~/components/link';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentPasswordResetSession();

  if (!session) return redirect('/forgot-password');
  if (!session.emailVerified) return redirect('/reset-password/verify-email');
  if (!user.registered2FA) return redirect('/reset-password');
  if (session.twoFactorVerified) return redirect('/reset-password');
  if (!user.registeredTOTP) return redirect(getPasswordReset2FARedirect(user));

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Authenticate with authenticator app')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <p>{tr('Enter the code from your app.')}</p>
        <PasswordResetTOTPForm />
      </CardContent>
      <CardFooter>
        <Link href="/reset-password/2fa/recovery-code">
          <Button variant="outline" className="w-full">
            {tr('Use recovery code')}
          </Button>
        </Link>
        {user.registeredSecurityKey && (
          <Link href="/reset-password/2fa/security-key">
            <Button variant="outline" className="w-full">
              {tr('Use security keys')}
            </Button>
          </Link>
        )}
        {user.registeredPasskey && (
          <Link href="/reset-password/2fa/passkey">
            <Button variant="outline" className="w-full">
              {tr('Use passkeys')}
            </Button>
          </Link>
        )}
      </CardFooter>
    </>
  );
}

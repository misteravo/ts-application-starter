import { getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardDescription, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { TotpVerificationForm } from './components';
import { AuthTitle } from '~/components/auth-title';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/2fa/setup');
  if (session.twoFactorVerified) return redirect('/');

  return (
    <>
      <CardHeader>
        <AuthTitle className="text-left">{tr('Authenticate with authenticator app')}</AuthTitle>
        <CardDescription>{tr('Enter the code from your authenticator app to continue.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <TotpVerificationForm />

        <Link href="/2fa/reset">
          <Button variant="outline" className="w-full">
            {tr('Use recovery code')}
          </Button>
        </Link>
        {user.registeredPasskey && (
          <Link href="/2fa/passkey">
            <Button variant="outline" className="mt-2 w-full">
              {tr('Use passkeys')}
            </Button>
          </Link>
        )}
        {user.registeredSecurityKey && (
          <Link href="/2fa/security-key">
            <Button variant="outline" className="mt-2 w-full">
              {tr('Use security keys')}
            </Button>
          </Link>
        )}
      </CardContent>
    </>
  );
}

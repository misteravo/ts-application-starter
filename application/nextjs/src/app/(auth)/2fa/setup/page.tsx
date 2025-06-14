import { getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardDescription, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { Link } from '~/components/link';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (user.registered2FA) return redirect('/');

  return (
    <>
      <CardHeader>
        <AuthTitle className="text-left">{tr('Set up two-factor authentication')}</AuthTitle>
        <CardDescription>{tr('Choose a method to add an extra layer of security to your account')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/2fa/totp/setup">
          <Button variant="outline" className="w-full justify-start">
            <span>{tr('Authenticator apps')}</span>
          </Button>
        </Link>
        <Link href="/2fa/passkey/register">
          <Button variant="outline" className="mt-2 w-full justify-start">
            <span>{tr('Passkeys')}</span>
          </Button>
        </Link>
        <Link href="/2fa/security-key/register">
          <Button variant="outline" className="mt-2 w-full justify-start">
            <span>{tr('Security keys')}</span>
          </Button>
        </Link>
      </CardContent>
    </>
  );
}

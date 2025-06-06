import { getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardDescription, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { Link } from '~/components/link';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (user.registered2FA) return redirect('/');

  return (
    <>
      <CardHeader>
        <AuthTitle className="text-left">Set up two-factor authentication</AuthTitle>
        <CardDescription>Choose a method to add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/2fa/totp/setup">
          <Button variant="outline" className="w-full justify-start">
            <span>Authenticator apps</span>
          </Button>
        </Link>
        <Link href="/2fa/passkey/register">
          <Button variant="outline" className="mt-2 w-full justify-start">
            <span>Passkeys</span>
          </Button>
        </Link>
        <Link href="/2fa/security-key/register">
          <Button variant="outline" className="mt-2 w-full justify-start">
            <span>Security keys</span>
          </Button>
        </Link>
      </CardContent>
    </>
  );
}

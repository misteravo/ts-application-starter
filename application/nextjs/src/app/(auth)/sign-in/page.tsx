import { get2FARedirect, getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardFooter, CardHeader } from '@acme/ui';
import { Link } from '~/components/link';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { LoginForm } from './components';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (session) {
    if (!user.emailVerified) return redirect('/verify-email');
    if (!user.registered2FA) return redirect('/2fa/setup');
    if (!session.twoFactorVerified) return redirect(get2FARedirect(user));
    return redirect('/');
  }

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Sign in to your account')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{tr("Don't have an account?")}</span>
          <Button variant="link" className="p-0" asChild>
            <Link href="/sign-up">{tr('Sign up')}</Link>
          </Button>
        </div>
      </CardFooter>
    </>
  );
}

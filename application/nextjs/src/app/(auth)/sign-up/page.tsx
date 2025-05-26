import { get2FARedirect, getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardFooter, CardHeader } from '@acme/ui';
import { Link } from '~/components/link';
import { redirect } from 'next/navigation';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';
import { SignUpForm } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (session) {
    if (!user.emailVerified) return redirect('/verify-email');
    if (!user.registered2FA) return redirect('/2fa/setup');
    if (!session.twoFactorVerified) return redirect(get2FARedirect(user));
    return redirect('/');
  }

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Create an account</AuthTitle>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Already have an account?</span>
          <Button variant="link" className="p-0" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </CardFooter>
    </AuthLayout>
  );
}

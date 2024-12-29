import { get2FARedirect, getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardHeader } from '@acme/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';
import { SignUpForm } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return 'Too many requests';
  }

  const { session, user } = await getCurrentSession();
  if (session !== null) {
    if (!user.emailVerified) {
      return redirect('/verify-email');
    }
    if (!user.registered2FA) {
      return redirect('/2fa/setup');
    }
    if (!session.twoFactorVerified) {
      return redirect(get2FARedirect(user));
    }
    return redirect('/');
  }

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Create an account</AuthTitle>
      </CardHeader>
      <CardContent>
        <SignUpForm />
        <div className="mt-4">
          <Link href="/sign-in">
            <Button variant="link" className="w-full">
              Already have an account? Sign in
            </Button>
          </Link>
        </div>
      </CardContent>
    </AuthLayout>
  );
}

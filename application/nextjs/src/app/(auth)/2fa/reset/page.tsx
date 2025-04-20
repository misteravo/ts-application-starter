import { CardContent, CardHeader } from '@acme/ui';
import { TwoFactorResetForm } from './components';

import { getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { redirect } from 'next/navigation';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (session === null) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/2fa/setup');
  if (session.twoFactorVerified) return redirect('/');

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Recover your account</AuthTitle>
      </CardHeader>
      <CardContent>
        <TwoFactorResetForm />
      </CardContent>
    </AuthLayout>
  );
}

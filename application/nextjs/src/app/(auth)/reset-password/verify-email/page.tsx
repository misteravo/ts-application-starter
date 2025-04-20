import { getCurrentPasswordResetSession, globalGETRateLimit } from '@acme/backend';
import { CardContent, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';
import { PasswordResetEmailVerificationForm } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session } = await getCurrentPasswordResetSession();
  if (session === null) return redirect('/forgot-password');
  if (session.emailVerified) {
    if (!session.twoFactorVerified) return redirect('/reset-password/2fa');
    return redirect('/reset-password');
  }

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Verify your email address</AuthTitle>
      </CardHeader>
      <CardContent>
        <p>We sent an 8-digit code to {session.email}.</p>
        <PasswordResetEmailVerificationForm />
      </CardContent>
    </AuthLayout>
  );
}

import { CardContent, CardHeader } from '@acme/ui';
import { PasswordResetForm } from './components';

import { getCurrentPasswordResetSession, globalGETRateLimit } from '@acme/backend';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) return redirect('/forgot-password');
  if (!session.emailVerified) return redirect('/reset-password/verify-email');
  if (user.registered2FA && !session.twoFactorVerified) return redirect('/reset-password/2fa');

  return (
    <>
      <CardHeader>
        <AuthTitle>Enter your new password</AuthTitle>
      </CardHeader>
      <CardContent>
        <PasswordResetForm />
      </CardContent>
    </>
  );
}

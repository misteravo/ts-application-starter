import { CardContent, CardHeader } from '@acme/ui';
import { PasswordResetRecoveryCodeForm } from './components';

import { getCurrentPasswordResetSession, globalGETRateLimit } from '@acme/backend';
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

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Use your recovery code')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <PasswordResetRecoveryCodeForm />
      </CardContent>
    </>
  );
}

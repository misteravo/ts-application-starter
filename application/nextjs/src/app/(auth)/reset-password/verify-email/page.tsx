import { getCurrentPasswordResetSession, globalGETRateLimit } from '@acme/backend';
import { CardContent, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { PasswordResetEmailVerificationForm } from './components';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session } = await getCurrentPasswordResetSession();
  if (!session) return redirect('/forgot-password');
  if (session.emailVerified) {
    if (!session.twoFactorVerified) return redirect('/reset-password/2fa');
    return redirect('/reset-password');
  }

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Verify your email address')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <p>
          {tr('We sent an 8-digit code to')} {session.email}.
        </p>
        <PasswordResetEmailVerificationForm />
      </CardContent>
    </>
  );
}

import { CardContent, CardHeader } from '@acme/ui';
import { TwoFactorResetForm } from './components';

import { getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/2fa/setup');
  if (session.twoFactorVerified) return redirect('/');

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Recover your account')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <TwoFactorResetForm />
      </CardContent>
    </>
  );
}

import { getCurrentSession, getCurrentUserEmailVerificationRequest, globalGETRateLimit } from '@acme/backend';
import { CardContent, CardDescription, CardHeader } from '@acme/ui';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { EmailVerificationForm, ResendEmailVerificationCodeForm } from './components';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { user } = await getCurrentSession();
  if (!user) return redirect('/redirect');

  // TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
  // but we can't set cookies inside server components.
  const verificationRequest = await getCurrentUserEmailVerificationRequest();
  if (!verificationRequest && user.emailVerified) return redirect('/');

  return (
    <>
      <CardHeader>
        <AuthTitle className="text-left">{tr('Verify your email address')}</AuthTitle>
        <CardDescription>
          {tr('We sent an 8-digit code to')} {verificationRequest?.email ?? user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EmailVerificationForm />
        <ResendEmailVerificationCodeForm />
      </CardContent>
    </>
  );
}

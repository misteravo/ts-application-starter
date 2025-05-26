import { CardContent, CardHeader } from '@acme/ui';
import { Link } from '~/components/link';
import { get2FARedirect, getCurrentSession, getUserRecoverCode, globalGETRateLimit } from '@acme/backend';
import { redirect } from 'next/navigation';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (!user.registered2FA) return redirect('/2fa/setup');
  if (!session.twoFactorVerified) return redirect(get2FARedirect(user));

  const recoveryCode = getUserRecoverCode(user.id);

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle>Recovery Code</AuthTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Your recovery code is: <strong>{recoveryCode}</strong>
        </p>
        <p>You can use this recovery code if you lose access to your second factors.</p>
        <div className="flex justify-end">
          <Link href="/" className="text-blue-500 hover:underline">
            Next
          </Link>
        </div>
      </CardContent>
    </AuthLayout>
  );
}

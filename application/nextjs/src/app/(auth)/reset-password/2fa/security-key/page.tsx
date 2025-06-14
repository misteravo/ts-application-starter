import {
  getCurrentPasswordResetSession,
  getPasswordReset2FARedirect,
  getUserSecurityKeyCredentials,
  globalGETRateLimit,
} from '@acme/backend';
import { CardContent, CardFooter, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { Link } from '~/components/link';
import { AuthTitle } from '~/components/auth-title';
import { VerifySecurityKeyButton } from './components';
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
  if (!user.registeredSecurityKey) return redirect(getPasswordReset2FARedirect(user));

  const credentials = await getUserSecurityKeyCredentials(user.id);

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Authenticate with security keys')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <VerifySecurityKeyButton encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))} />
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/reset-password/2fa/recovery-code" className="text-blue-500">
          {tr('Use recovery code')}
        </Link>
        {user.registeredTOTP && (
          <Link href="/reset-password/2fa/totp" className="text-blue-500">
            {tr('Use authenticator apps')}
          </Link>
        )}
        {user.registeredPasskey && (
          <Link href="/reset-password/2fa/passkey" className="text-blue-500">
            {tr('Use passkeys')}
          </Link>
        )}
      </CardFooter>
    </>
  );
}

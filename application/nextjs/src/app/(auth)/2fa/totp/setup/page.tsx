import { TwoFactorSetUpForm } from './components';

import { get2FARedirect, getCurrentSession, globalGETRateLimit } from '@acme/backend';
import { CardContent, CardDescription, CardHeader } from '@acme/ui';
import { encodeBase64 } from '@oslojs/encoding';
import { createTOTPKeyURI } from '@oslojs/otp';
import { redirect } from 'next/navigation';
import { renderSVG } from 'uqr';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';

export default async function Page() {
  if (!(await globalGETRateLimit())) {
    return 'Too many requests';
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return redirect('/sign-in');
  }
  if (!user.emailVerified) {
    return redirect('/verify-email');
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect(get2FARedirect(user));
  }

  const totpKey = new Uint8Array(20);
  crypto.getRandomValues(totpKey);
  const encodedTOTPKey = encodeBase64(totpKey);
  const keyURI = createTOTPKeyURI('Demo', user.username, totpKey, 30, 6);
  const qrcode = renderSVG(keyURI);

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle className="text-left">Set up authenticator app</AuthTitle>
        <CardDescription>Scan the QR code below with your authenticator app to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div
            className="h-[200px] w-[200px]"
            dangerouslySetInnerHTML={{
              __html: qrcode,
            }}
          />
        </div>
        <TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
      </CardContent>
    </AuthLayout>
  );
}

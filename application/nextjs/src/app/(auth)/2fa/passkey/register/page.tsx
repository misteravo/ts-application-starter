import { get2FARedirect, getCurrentSession, getUserPasskeyCredentials, globalGETRateLimit } from '@acme/backend';
import { CardContent, CardHeader } from '@acme/ui';
import { bigEndian } from '@oslojs/binary';
import { encodeBase64 } from '@oslojs/encoding';
import { redirect } from 'next/navigation';
import { AuthTitle } from '~/components/auth-title';
import { RegisterPasskeyForm } from './components';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (!user.emailVerified) return redirect('/verify-email');
  if (user.registered2FA && !session.twoFactorVerified) return redirect(get2FARedirect(user));

  const credentials = await getUserPasskeyCredentials(user.id);
  const credentialUserId = new Uint8Array(8);
  bigEndian.putUint64(credentialUserId, BigInt(user.id), 0);

  return (
    <>
      <CardHeader>
        <AuthTitle>{tr('Register Passkey')}</AuthTitle>
      </CardHeader>
      <CardContent>
        <RegisterPasskeyForm
          encodedCredentialIds={credentials.map((credential) => encodeBase64(credential.id))}
          user={user}
          encodedCredentialUserId={encodeBase64(credentialUserId)}
        />
      </CardContent>
    </>
  );
}

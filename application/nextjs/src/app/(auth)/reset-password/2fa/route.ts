import { getCurrentPasswordResetSession, getPasswordReset2FARedirect, globalGETRateLimit } from '@acme/backend';

export async function GET() {
  if (!(await globalGETRateLimit())) return new Response('Too many requests', { status: 429 });

  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/sign-in',
      },
    });
  }
  if (!user.registered2FA || session.twoFactorVerified) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/reset-password',
      },
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: getPasswordReset2FARedirect(user),
    },
  });
}

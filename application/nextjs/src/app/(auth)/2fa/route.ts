import { get2FARedirect, getCurrentSession, globalGETRateLimit } from '@acme/backend';

export async function GET() {
  if (!(await globalGETRateLimit())) return new Response('Too many requests', { status: 429 });

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/sign-in',
      },
    });
  }
  if (session.twoFactorVerified) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
      },
    });
  }
  if (!user.registered2FA) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/2fa/setup',
      },
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: get2FARedirect(user),
    },
  });
}

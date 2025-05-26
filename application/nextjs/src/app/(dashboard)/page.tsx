import { getCurrentSession } from '@acme/backend';

import { get2FARedirect } from '@acme/backend';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect(get2FARedirect(user));
  }

  return <h1 className="text-2xl font-bold">Welcome to your dashboard</h1>;
}

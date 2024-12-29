import { deleteSessionTokenCookie, getCurrentSession, globalPOSTRateLimit, invalidateSession } from '@acme/backend';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!(await globalPOSTRateLimit())) return NextResponse.json({ message: 'Too many requests' });

  const { session } = await getCurrentSession();
  if (session) {
    await invalidateSession(session.id);
    await deleteSessionTokenCookie();
  }
  return redirect('/sign-in');
}

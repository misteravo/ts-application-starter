import { eq } from 'drizzle-orm';
import { db, s } from '../../db';

export function verifyEmailInput(email: string): boolean {
  return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string) {
  const user = await db.query.user.findFirst({ where: eq(s.user.email, email) });
  return user === undefined;
}

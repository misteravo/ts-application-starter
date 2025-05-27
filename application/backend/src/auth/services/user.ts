import { and, eq, sql } from 'drizzle-orm';
import { db, s } from '../../db';
import { decryptToString, encryptString } from './encryption';
import { hashPassword } from './password';
import { generateRandomRecoveryCode } from './utils';

export function verifyUsernameInput(username: string) {
  return username.length > 3 && username.length < 32 && username.trim() === username;
}

export async function createUser(email: string, username: string, password: string) {
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);

  const [row] = await db
    .insert(s.user)
    .values({ email, username, passwordHash, recoveryCode: encryptedRecoveryCode })
    .returning({ id: s.user.id });
  if (!row) throw new Error('Unexpected error');

  const user: User = {
    id: row.id,
    username,
    email,
    emailVerified: false,
    registeredTOTP: false,
    registeredPasskey: false,
    registeredSecurityKey: false,
    registered2FA: false,
  };
  return user;
}

export async function updateUserPassword(userId: number, password: string) {
  const passwordHash = await hashPassword(password);
  await db.update(s.user).set({ passwordHash }).where(eq(s.user.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string) {
  await db.update(s.user).set({ email, emailVerified: true }).where(eq(s.user.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string) {
  const result = await db
    .update(s.user)
    .set({ emailVerified: true })
    .where(and(eq(s.user.id, userId), eq(s.user.email, email)));
  return result.rowCount && result.rowCount > 0;
}

export async function getUserPasswordHash(userId: number) {
  const user = await db.query.user.findFirst({ where: eq(s.user.id, userId) });
  if (user === undefined) throw new Error('Invalid user ID');
  return user.passwordHash;
}

export async function getUserRecoverCode(userId: number) {
  const user = await db.query.user.findFirst({ where: eq(s.user.id, userId), columns: { recoveryCode: true } });
  if (!user) throw new Error('Invalid user ID');
  return decryptToString(user.recoveryCode);
}

export async function resetUserRecoveryCode(userId: number) {
  const recoveryCode = generateRandomRecoveryCode();
  const encrypted = encryptString(recoveryCode);
  await db.update(s.user).set({ recoveryCode: encrypted }).where(eq(s.user.id, userId));
  return recoveryCode;
}

export async function getUserFromEmail(email: string) {
  const [row] = await db
    .select({
      id: s.user.id,
      email: s.user.email,
      username: s.user.username,
      emailVerified: s.user.emailVerified,
      hasTOTP: sql<number>`CASE WHEN ${s.totpCredential.id} IS NOT NULL THEN 1 ELSE 0 END`,
      hasPasskey: sql<number>`CASE WHEN ${s.passkeyCredential.id} IS NOT NULL THEN 1 ELSE 0 END`,
      hasSecurityKey: sql<number>`CASE WHEN ${s.securityKeyCredential.id} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(s.user)
    .leftJoin(s.totpCredential, eq(s.user.id, s.totpCredential.userId))
    .leftJoin(s.passkeyCredential, eq(s.user.id, s.passkeyCredential.userId))
    .leftJoin(s.securityKeyCredential, eq(s.user.id, s.securityKeyCredential.userId))
    .where(eq(s.user.email, email))
    .limit(1);

  if (!row) return null;

  const user: User = {
    id: row.id,
    email: row.email,
    username: row.username,
    emailVerified: Boolean(row.emailVerified),
    registeredTOTP: Boolean(row.hasTOTP),
    registeredPasskey: Boolean(row.hasPasskey),
    registeredSecurityKey: Boolean(row.hasSecurityKey),
    registered2FA: false,
  };
  if (user.registeredPasskey || user.registeredSecurityKey || user.registeredTOTP) {
    user.registered2FA = true;
  }
  return user;
}

export interface User {
  id: number;
  email: string;
  username: string;
  emailVerified: boolean;
  registeredTOTP: boolean;
  registeredSecurityKey: boolean;
  registeredPasskey: boolean;
  registered2FA: boolean;
}

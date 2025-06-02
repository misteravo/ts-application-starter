import { eq } from 'drizzle-orm';
import { db, s } from '../../db';
import { decrypt, encrypt } from './encryption';
import { ExpiringTokenBucket, RefillingTokenBucket } from './rate-limit';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function getUserTOTPKey(userId: number): Promise<Uint8Array | null> {
  const credential = await db.query.totpCredential.findFirst({
    where: eq(s.totpCredential.userId, userId),
  });
  if (credential === undefined) {
    return null;
  }
  return decrypt(decodeBase64(credential.key));
}

export async function updateUserTOTPKey(userId: number, key: Uint8Array) {
  const encrypted = encrypt(key);
  await db.transaction(async (tx) => {
    await tx.delete(s.totpCredential).where(eq(s.totpCredential.userId, userId));
    await tx.insert(s.totpCredential).values({
      userId,
      key: encodeBase64(encrypted),
    });
  });
}

export async function deleteUserTOTPKey(userId: number) {
  await db.delete(s.totpCredential).where(eq(s.totpCredential.userId, userId));
}

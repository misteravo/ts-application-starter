import { and, eq } from 'drizzle-orm';
import { db, s } from '../../db';
import { ExpiringTokenBucket } from './rate-limit';
import { generateRandomRecoveryCode } from './utils';

import type { User } from './user';

export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string) {
  const user = await db.query.user.findFirst({
    where: eq(s.user.id, userId),
    columns: { recoveryCode: true },
  });
  if (!user) return false;

  const userRecoveryCode = user.recoveryCode;
  if (recoveryCode !== userRecoveryCode) return false;

  const newRecoveryCode = generateRandomRecoveryCode();

  await db.transaction(async (tx) => {
    // Update user recovery code
    const result = await tx
      .update(s.user)
      .set({ recoveryCode: newRecoveryCode })
      .where(and(eq(s.user.id, userId), eq(s.user.recoveryCode, user.recoveryCode)));

    if (!result.rowCount) {
      tx.rollback();
      return false;
    }

    // Reset 2FA verification in sessions
    await tx.update(s.session).set({ twoFactorVerified: false }).where(eq(s.session.userId, userId));

    // Delete all 2FA credentials
    await tx.delete(s.totpCredential).where(eq(s.totpCredential.userId, userId));
    await tx.delete(s.passkeyCredential).where(eq(s.passkeyCredential.userId, userId));
    await tx.delete(s.securityKeyCredential).where(eq(s.securityKeyCredential.userId, userId));
  });

  return true;
}

export function get2FARedirect(user: User): string {
  if (user.registeredSecurityKey) return '/2fa/security-key';
  if (user.registeredTOTP) return '/2fa/totp';
  if (user.registeredPasskey) return '/2fa/passkey';
  return '/2fa/setup';
}

export function getPasswordReset2FARedirect(user: User): string {
  if (user.registeredSecurityKey) return '/reset-password/2fa/security-key';
  if (user.registeredTOTP) return '/reset-password/2fa/totp';
  if (user.registeredPasskey) return '/reset-password/2fa/passkey';
  return '/2fa/setup';
}

export async function resetUser2FA(userId: number): Promise<boolean> {
  const result = await db.transaction(async (tx) => {
    await tx.delete(s.totpCredential).where(eq(s.totpCredential.userId, userId));
    await tx.delete(s.passkeyCredential).where(eq(s.passkeyCredential.userId, userId));
    await tx.delete(s.securityKeyCredential).where(eq(s.securityKeyCredential.userId, userId));
    const recoveryCode = generateRandomRecoveryCode();
    const result = await tx.update(s.user).set({ recoveryCode }).where(eq(s.user.id, userId));
    if (result.rowCount && result.rowCount < 1) {
      tx.rollback();
      return false;
    }
    await tx.update(s.session).set({ twoFactorVerified: false }).where(eq(s.session.userId, userId));
    return true;
  });
  return result;
}

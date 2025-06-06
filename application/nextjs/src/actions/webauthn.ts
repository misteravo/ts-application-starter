'use server';

import { createWebAuthnChallenge, RefillingTokenBucket } from '@acme/backend';
import { encodeBase64 } from '@oslojs/encoding';
import { headers } from 'next/headers';

const webauthnChallengeRateLimitBucket = new RefillingTokenBucket<string>(30, 10);

export async function createWebAuthnChallengeAction(): Promise<string> {
  const headersList = await headers();
  const clientIP = headersList.get('X-Forwarded-For');
  if (clientIP !== null && !webauthnChallengeRateLimitBucket.consume(clientIP, 1)) {
    throw new Error('Too many requests');
  }
  const challenge = createWebAuthnChallenge();
  return encodeBase64(challenge);
}

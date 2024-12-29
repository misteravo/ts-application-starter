import { encodeHexLowerCase } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import { db, s } from '../../db';

const challengeBucket = new Set<string>();

export function createWebAuthnChallenge(): Uint8Array {
  const challenge = new Uint8Array(20);
  crypto.getRandomValues(challenge);
  const encoded = encodeHexLowerCase(challenge);
  challengeBucket.add(encoded);
  return challenge;
}

export function verifyWebAuthnChallenge(challenge: Uint8Array): boolean {
  const encoded = encodeHexLowerCase(challenge);
  return challengeBucket.delete(encoded);
}

export async function getUserPasskeyCredentials(userId: number) {
  const passkeyCredentials = await db.query.passkeyCredential.findMany({
    where: eq(s.passkeyCredential.userId, userId),
  });
  const credentials: WebAuthnUserCredential[] = [];
  for (const passkeyCredential of passkeyCredentials) {
    const credential: WebAuthnUserCredential = {
      id: passkeyCredential.id,
      userId: passkeyCredential.userId,
      name: passkeyCredential.name,
      algorithmId: passkeyCredential.algorithm,
      publicKey: passkeyCredential.publicKey,
    };
    credentials.push(credential);
  }
  return credentials;
}

export async function getPasskeyCredential(credentialId: Uint8Array) {
  const passkeyCredential = await db.query.passkeyCredential.findFirst({
    where: eq(s.passkeyCredential.id, credentialId),
  });
  if (passkeyCredential === undefined) return null;

  const credential: WebAuthnUserCredential = {
    id: passkeyCredential.id,
    userId: passkeyCredential.userId,
    name: passkeyCredential.name,
    algorithmId: passkeyCredential.algorithm,
    publicKey: passkeyCredential.publicKey,
  };
  return credential;
}

export async function getUserPasskeyCredential(userId: number, credentialId: Uint8Array) {
  const passkeyCredential = await db.query.passkeyCredential.findFirst({
    where: and(eq(s.passkeyCredential.id, credentialId), eq(s.passkeyCredential.userId, userId)),
  });
  if (passkeyCredential === undefined) return null;

  const credential: WebAuthnUserCredential = {
    id: passkeyCredential.id,
    userId: passkeyCredential.userId,
    name: passkeyCredential.name,
    algorithmId: passkeyCredential.algorithm,
    publicKey: passkeyCredential.publicKey,
  };
  return credential;
}

export async function createPasskeyCredential(credential: WebAuthnUserCredential) {
  await db.insert(s.passkeyCredential).values({
    id: credential.id,
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: credential.publicKey,
  });
}

export async function deleteUserPasskeyCredential(userId: number, credentialId: Uint8Array) {
  const result = await db
    .delete(s.passkeyCredential)
    .where(and(eq(s.passkeyCredential.id, credentialId), eq(s.passkeyCredential.userId, userId)));
  return result.changes > 0;
}

export async function getUserSecurityKeyCredentials(userId: number) {
  const securityKeyCredentials = await db.query.securityKeyCredential.findMany({
    where: eq(s.securityKeyCredential.userId, userId),
  });
  const credentials: WebAuthnUserCredential[] = [];
  for (const securityKeyCredential of securityKeyCredentials) {
    const credential: WebAuthnUserCredential = {
      id: securityKeyCredential.id,
      userId: securityKeyCredential.userId,
      name: securityKeyCredential.name,
      algorithmId: securityKeyCredential.algorithm,
      publicKey: securityKeyCredential.publicKey,
    };
    credentials.push(credential);
  }
  return credentials;
}

export async function getUserSecurityKeyCredential(userId: number, credentialId: Uint8Array) {
  const securityKeyCredential = await db.query.securityKeyCredential.findFirst({
    where: and(eq(s.securityKeyCredential.id, credentialId), eq(s.securityKeyCredential.userId, userId)),
  });
  if (securityKeyCredential === undefined) return null;
  const credential: WebAuthnUserCredential = {
    id: securityKeyCredential.id,
    userId: securityKeyCredential.userId,
    name: securityKeyCredential.name,
    algorithmId: securityKeyCredential.algorithm,
    publicKey: securityKeyCredential.publicKey,
  };
  return credential;
}

export async function createSecurityKeyCredential(credential: WebAuthnUserCredential) {
  await db.insert(s.securityKeyCredential).values({
    id: credential.id,
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: credential.publicKey,
  });
}

export async function deleteUserSecurityKeyCredential(userId: number, credentialId: Uint8Array) {
  const result = await db
    .delete(s.securityKeyCredential)
    .where(and(eq(s.securityKeyCredential.id, credentialId), eq(s.securityKeyCredential.userId, userId)));
  return result.changes > 0;
}

export interface WebAuthnUserCredential {
  id: Uint8Array;
  userId: number;
  name: string;
  algorithmId: number;
  publicKey: Uint8Array;
}

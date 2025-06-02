import { decodeBase64, encodeBase64, encodeHexLowerCase } from '@oslojs/encoding';
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
      id: decodeBase64(passkeyCredential.id),
      userId: passkeyCredential.userId,
      name: passkeyCredential.name,
      algorithmId: passkeyCredential.algorithm,
      publicKey: decodeBase64(passkeyCredential.publicKey),
    };
    credentials.push(credential);
  }
  return credentials;
}

export async function getPasskeyCredential(credentialId: Uint8Array) {
  const passkeyCredential = await db.query.passkeyCredential.findFirst({
    where: eq(s.passkeyCredential.id, encodeBase64(credentialId)),
  });
  if (passkeyCredential === undefined) return null;

  const credential: WebAuthnUserCredential = {
    id: decodeBase64(passkeyCredential.id),
    userId: passkeyCredential.userId,
    name: passkeyCredential.name,
    algorithmId: passkeyCredential.algorithm,
    publicKey: decodeBase64(passkeyCredential.publicKey),
  };
  return credential;
}

export async function getUserPasskeyCredential(userId: number, credentialId: Uint8Array) {
  const passkeyCredential = await db.query.passkeyCredential.findFirst({
    where: and(eq(s.passkeyCredential.id, encodeBase64(credentialId)), eq(s.passkeyCredential.userId, userId)),
  });
  if (passkeyCredential === undefined) return null;

  const credential: WebAuthnUserCredential = {
    id: decodeBase64(passkeyCredential.id),
    userId: passkeyCredential.userId,
    name: passkeyCredential.name,
    algorithmId: passkeyCredential.algorithm,
    publicKey: decodeBase64(passkeyCredential.publicKey),
  };
  return credential;
}

export async function createPasskeyCredential(credential: WebAuthnUserCredential) {
  await db.insert(s.passkeyCredential).values({
    id: encodeBase64(credential.id),
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: encodeBase64(credential.publicKey),
  });
}

export async function deleteUserPasskeyCredential(userId: number, credentialId: Uint8Array) {
  const result = await db
    .delete(s.passkeyCredential)
    .where(and(eq(s.passkeyCredential.id, encodeBase64(credentialId)), eq(s.passkeyCredential.userId, userId)));
  return result.rowCount && result.rowCount > 0;
}

export async function getUserSecurityKeyCredentials(userId: number) {
  const securityKeyCredentials = await db.query.securityKeyCredential.findMany({
    where: eq(s.securityKeyCredential.userId, userId),
  });
  const credentials: WebAuthnUserCredential[] = [];
  for (const securityKeyCredential of securityKeyCredentials) {
    const credential: WebAuthnUserCredential = {
      id: decodeBase64(securityKeyCredential.id),
      userId: securityKeyCredential.userId,
      name: securityKeyCredential.name,
      algorithmId: securityKeyCredential.algorithm,
      publicKey: decodeBase64(securityKeyCredential.publicKey),
    };
    credentials.push(credential);
  }
  return credentials;
}

export async function getUserSecurityKeyCredential(userId: number, credentialId: Uint8Array) {
  const securityKeyCredential = await db.query.securityKeyCredential.findFirst({
    where: and(eq(s.securityKeyCredential.id, encodeBase64(credentialId)), eq(s.securityKeyCredential.userId, userId)),
  });
  if (securityKeyCredential === undefined) return null;
  const credential: WebAuthnUserCredential = {
    id: decodeBase64(securityKeyCredential.id),
    userId: securityKeyCredential.userId,
    name: securityKeyCredential.name,
    algorithmId: securityKeyCredential.algorithm,
    publicKey: decodeBase64(securityKeyCredential.publicKey),
  };
  return credential;
}

export async function createSecurityKeyCredential(credential: WebAuthnUserCredential) {
  await db.insert(s.securityKeyCredential).values({
    id: encodeBase64(credential.id),
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: encodeBase64(credential.publicKey),
  });
}

export async function deleteUserSecurityKeyCredential(userId: number, credentialId: Uint8Array) {
  const result = await db
    .delete(s.securityKeyCredential)
    .where(and(eq(s.securityKeyCredential.id, encodeBase64(credentialId)), eq(s.securityKeyCredential.userId, userId)));
  return result.rowCount && result.rowCount > 0;
}

export interface WebAuthnUserCredential {
  id: Uint8Array;
  userId: number;
  name: string;
  algorithmId: number;
  publicKey: Uint8Array;
}

import { safeTry, safeTrySync } from '@acme/utils';
import {
  decodePKIXECDSASignature,
  decodeSEC1PublicKey,
  ECDSAPublicKey,
  p256,
  verifyECDSASignature,
} from '@oslojs/crypto/ecdsa';
import {
  decodePKCS1RSAPublicKey,
  RSAPublicKey,
  sha256ObjectIdentifier,
  verifyRSASSAPKCS1v15Signature,
} from '@oslojs/crypto/rsa';
import { sha256 } from '@oslojs/crypto/sha2';
import {
  AttestationStatementFormat,
  ClientDataType,
  coseAlgorithmES256,
  coseAlgorithmRS256,
  coseEllipticCurveP256,
  createAssertionSignatureMessage,
  parseAttestationObject,
  parseAuthenticatorData,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { env } from '../../../env';
import { getCurrentPasswordResetSession, setPasswordResetSessionAs2FAVerified } from '../../services/password-reset';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import type { User } from '../../services/user';
import type { WebAuthnUserCredential } from '../../services/webauthn';
import {
  createPasskeyCredential,
  getUserPasskeyCredential,
  getUserPasskeyCredentials,
  verifyWebAuthnChallenge,
} from '../../services/webauthn';

type Result = { message: string } | { redirect: string };

export async function verifyPasskey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (!user.registeredPasskey) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  const result = await verifyPasskeyHelper({ user, ...props });
  if (result.message !== null) return { message: result.message };

  await setSessionAs2FAVerified(session.id);
  return { redirect: '/' };
}

export async function registerPasskey(props: {
  name: string;
  attestationObject: Uint8Array;
  clientData: Uint8Array;
}): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (user.registered2FA && !session.twoFactorVerified) return { message: 'Forbidden' };

  const [attestationObject] = safeTrySync(() => parseAttestationObject(props.attestationObject));
  if (!attestationObject) return { message: 'Invalid data' };
  const attestationStatement = attestationObject.attestationStatement;
  const authenticatorData = attestationObject.authenticatorData;

  if (attestationStatement.format !== AttestationStatementFormat.None) return { message: 'Invalid data' };
  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };
  if (!authenticatorData.userVerified) return { message: 'Invalid data' };
  if (authenticatorData.credential === null) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Create) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };
  if (clientData.origin !== env.SERVER_URL) return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  let credential: WebAuthnUserCredential;
  if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
    const [cosePublicKey] = safeTrySync(() => authenticatorData.credential?.publicKey.ec2());
    if (!cosePublicKey) return { message: 'Invalid data' };
    if (cosePublicKey.curve !== coseEllipticCurveP256) return { message: 'Unsupported algorithm' };

    const encodedPublicKey = new ECDSAPublicKey(p256, cosePublicKey.x, cosePublicKey.y).encodeSEC1Uncompressed();
    credential = {
      id: authenticatorData.credential.id,
      userId: user.id,
      algorithmId: coseAlgorithmES256,
      name: props.name,
      publicKey: encodedPublicKey,
    };
  } else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
    const [cosePublicKey] = safeTrySync(() => authenticatorData.credential?.publicKey.rsa());
    if (!cosePublicKey) return { message: 'Invalid data' };

    const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
    credential = {
      id: authenticatorData.credential.id,
      userId: user.id,
      algorithmId: coseAlgorithmRS256,
      name: props.name,
      publicKey: encodedPublicKey,
    };
  } else {
    return { message: 'Unsupported algorithm' };
  }

  // We don't have to worry about race conditions since queries are synchronous
  const credentials = await getUserPasskeyCredentials(user.id);
  if (credentials.length >= 5) return { message: 'Too many credentials' };

  const [, error] = await safeTry(createPasskeyCredential(credential));
  if (error) {
    // PostgreSQL unique constraint violation error code is '23505'
    if (error instanceof Error && 'code' in error && error.code === '23505') return { message: 'Invalid data' };
    return { message: 'Internal error' };
  }

  if (!session.twoFactorVerified) await setSessionAs2FAVerified(session.id);

  if (!user.registered2FA) return { redirect: '/recovery-code' };
  return { redirect: '/' };
}

export async function verifyResetPasskey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<Result> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (!user.registeredPasskey) return { message: 'Forbidden' };
  if (session.twoFactorVerified) return { message: 'Forbidden' };

  const result = await verifyPasskeyHelper({ user, ...props });
  if (result.message !== null) return { message: result.message };

  await setPasswordResetSessionAs2FAVerified(session.id);
  return { redirect: '/reset-password' };
}

async function verifyPasskeyHelper(props: {
  user: User;
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}) {
  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) return { message: 'Invalid data' };

  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };

  if (clientData.origin !== env.SERVER_URL) return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  const credential = await getUserPasskeyCredential(props.user.id, props.credentialId);
  if (credential === null) return { message: 'Invalid credential' };

  let validSignature: boolean;
  if (credential.algorithmId === coseAlgorithmES256) {
    const ecdsaSignature = decodePKIXECDSASignature(props.signature);
    const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(props.authenticatorData, props.clientData));
    validSignature = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);
  } else if (credential.algorithmId === coseAlgorithmRS256) {
    const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(props.authenticatorData, props.clientData));
    validSignature = verifyRSASSAPKCS1v15Signature(rsaPublicKey, sha256ObjectIdentifier, hash, props.signature);
  } else {
    return { message: 'Internal error' };
  }

  if (!validSignature) return { message: 'Invalid data' };

  return { message: null };
}

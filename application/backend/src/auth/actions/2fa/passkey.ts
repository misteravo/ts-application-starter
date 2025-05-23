import { safeTrySync } from '@acme/utils';
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
import type {
  AttestationStatement,
  AuthenticatorData,
  ClientData,
  COSEEC2PublicKey,
  COSERSAPublicKey,
} from '@oslojs/webauthn';
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
import { SqliteError } from 'better-sqlite3';
import { env } from '../../../env';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import type { WebAuthnUserCredential } from '../../services/webauthn';
import {
  createPasskeyCredential,
  getUserPasskeyCredential,
  getUserPasskeyCredentials,
  verifyWebAuthnChallenge,
} from '../../services/webauthn';
import { getCurrentPasswordResetSession, setPasswordResetSessionAs2FAVerified } from '../../services/password-reset';

type Result = { message: string } | { redirect: string };

export async function verifyPasskey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (!session) return { message: 'Not authenticated' };

  if (!user.emailVerified || !user.registeredPasskey || session.twoFactorVerified) {
    return { message: 'Forbidden' };
  }

  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) return { message: 'Invalid data' };

  // TODO: Update host
  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };

  // TODO: Update origin
  if (clientData.origin !== env.SERVER_URL) return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  const credential = await getUserPasskeyCredential(user.id, props.credentialId);
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

  await setSessionAs2FAVerified(session.id);
  return { redirect: '/' };
}

export async function registerPasskey(props: {
  name: string;
  attestationObject: Uint8Array;
  clientData: Uint8Array;
}): Promise<Result> {
  const { session, user } = await getCurrentSession();
  if (session === null) return { message: 'Not authenticated' };
  if (!user.emailVerified) return { message: 'Forbidden' };
  if (user.registered2FA && !session.twoFactorVerified) return { message: 'Forbidden' };

  let attestationStatement: AttestationStatement;
  let authenticatorData: AuthenticatorData;
  try {
    const attestationObject = parseAttestationObject(props.attestationObject);
    attestationStatement = attestationObject.attestationStatement;
    authenticatorData = attestationObject.authenticatorData;
  } catch {
    return { message: 'Invalid data' };
  }
  if (attestationStatement.format !== AttestationStatementFormat.None) return { message: 'Invalid data' };

  // TODO: Update host
  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) return { message: 'Invalid data' };
  if (authenticatorData.credential === null) return { message: 'Invalid data' };

  let clientData: ClientData;
  try {
    clientData = parseClientDataJSON(props.clientData);
  } catch {
    return { message: 'Invalid data' };
  }
  if (clientData.type !== ClientDataType.Create) return { message: 'Invalid data' };
  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };

  // TODO: Update origin
  if (clientData.origin !== env.SERVER_URL) return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  let credential: WebAuthnUserCredential;
  if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
    let cosePublicKey: COSEEC2PublicKey;
    try {
      cosePublicKey = authenticatorData.credential.publicKey.ec2();
    } catch {
      return { message: 'Invalid data' };
    }
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
    let cosePublicKey: COSERSAPublicKey;
    try {
      cosePublicKey = authenticatorData.credential.publicKey.rsa();
    } catch {
      return { message: 'Invalid data' };
    }

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

  try {
    await createPasskeyCredential(credential);
  } catch (error) {
    if (error instanceof SqliteError && error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY')
      return { message: 'Invalid data' };
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
  if (session === null) return { message: 'Not authenticated' };
  if (!session.emailVerified || !user.registeredPasskey || session.twoFactorVerified) return { message: 'Forbidden' };

  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) return { message: 'Invalid data' };

  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) {
    return { message: 'Invalid data' };
  }
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };
  if (clientData.origin !== env.SERVER_URL) return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  const credential = await getUserPasskeyCredential(user.id, props.credentialId);
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

  await setPasswordResetSessionAs2FAVerified(session.id);
  return { redirect: '/reset-password' };
}

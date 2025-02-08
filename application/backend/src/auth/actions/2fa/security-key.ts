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
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import type { WebAuthnUserCredential } from '../../services/webauthn';
import {
  createSecurityKeyCredential,
  getUserSecurityKeyCredential,
  getUserSecurityKeyCredentials,
  verifyWebAuthnChallenge,
} from '../../services/webauthn';

type Result = { message: string } | { redirect: string };

export async function verifySecurityKey(props: {
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
  if (!authenticatorData.verifyRelyingPartyIdHash('localhost')) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };

  // TODO: Update origin
  if (clientData.origin !== 'http://localhost:3000') return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  const credential = await getUserSecurityKeyCredential(user.id, props.credentialId);
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
  return { redirect: '/2fa/security-key' };
}

export async function registerSecurityKey(props: {
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
  if (!authenticatorData.verifyRelyingPartyIdHash('localhost')) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent) return { message: 'Invalid data' };
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
  if (clientData.origin !== 'http://localhost:3000') return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  let credential: WebAuthnUserCredential;
  if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
    let cosePublicKey: COSEEC2PublicKey;
    try {
      cosePublicKey = authenticatorData.credential.publicKey.ec2();
    } catch {
      return {
        message: 'Invalid data',
      };
    }
    if (cosePublicKey.curve !== coseEllipticCurveP256) {
      return {
        message: 'Unsupported algorithm',
      };
    }
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
      return {
        message: 'Invalid data',
      };
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
  const credentials = await getUserSecurityKeyCredentials(user.id);
  if (credentials.length >= 5) return { message: 'Too many credentials' };

  try {
    await createSecurityKeyCredential(credential);
  } catch (e) {
    if (e instanceof SqliteError && e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return { message: 'Invalid data' };
    return { message: 'Internal error' };
  }

  if (!session.twoFactorVerified) await setSessionAs2FAVerified(session.id);

  if (!user.registered2FA) return { redirect: '/recovery-code' };
  return { redirect: '/' };
}

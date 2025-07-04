import { ClientError, safeTry, safeTrySync } from '@acme/utils';
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
import type { WebAuthnUserCredential } from '../../services/webauthn';
import {
  createSecurityKeyCredential,
  getUserSecurityKeyCredential,
  getUserSecurityKeyCredentials,
  verifyWebAuthnChallenge,
} from '../../services/webauthn';
import type { User } from '../../services/user';

export async function verifySecurityKey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (!user.registeredPasskey) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  await verifySecurityKeyHelper({ user, ...props });

  await setSessionAs2FAVerified(session.id);
  return { redirect: '/2fa/security-key' };
}

export async function registerSecurityKey(props: {
  name: string;
  attestationObject: Uint8Array;
  clientData: Uint8Array;
}): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!user.emailVerified) throw new ClientError('Forbidden');
  if (user.registered2FA && !session.twoFactorVerified) throw new ClientError('Forbidden');

  const [attestationObject] = safeTrySync(() => parseAttestationObject(props.attestationObject));
  if (!attestationObject) throw new ClientError('Invalid data');

  const attestationStatement = attestationObject.attestationStatement;
  const authenticatorData = attestationObject.authenticatorData;

  if (attestationStatement.format !== AttestationStatementFormat.None) throw new ClientError('Invalid data');
  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) throw new ClientError('Invalid data');
  if (!authenticatorData.userPresent) throw new ClientError('Invalid data');
  if (authenticatorData.credential === null) throw new ClientError('Invalid data');

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) throw new ClientError('Invalid data');

  if (clientData.type !== ClientDataType.Create) throw new ClientError('Invalid data');

  if (!verifyWebAuthnChallenge(clientData.challenge)) throw new ClientError('Invalid data');
  if (clientData.origin !== env.SERVER_URL) throw new ClientError('Invalid data');
  if (clientData.crossOrigin !== null && clientData.crossOrigin) throw new ClientError('Invalid data');

  let credential: WebAuthnUserCredential;
  if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
    const [cosePublicKey] = safeTrySync(() => authenticatorData.credential?.publicKey.ec2());
    if (!cosePublicKey) throw new ClientError('Invalid data');
    if (cosePublicKey.curve !== coseEllipticCurveP256) throw new ClientError('Unsupported algorithm');

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
    if (!cosePublicKey) throw new ClientError('Invalid data');

    const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
    credential = {
      id: authenticatorData.credential.id,
      userId: user.id,
      algorithmId: coseAlgorithmRS256,
      name: props.name,
      publicKey: encodedPublicKey,
    };
  } else {
    throw new ClientError('Unsupported algorithm');
  }

  // We don't have to worry about race conditions since queries are synchronous
  const credentials = await getUserSecurityKeyCredentials(user.id);
  if (credentials.length >= 5) throw new ClientError('Too many credentials');

  const [, error] = await safeTry(createSecurityKeyCredential(credential));
  if (error) {
    // PostgreSQL unique constraint violation error code is '23505'
    if (error instanceof Error && 'code' in error && error.code === '23505') throw new ClientError('Invalid data');
    throw new ClientError('Internal error');
  }

  if (!session.twoFactorVerified) await setSessionAs2FAVerified(session.id);

  if (!user.registered2FA) return { redirect: '/recovery-code' };
  return { redirect: '/' };
}

export async function verifyResetSecurityKey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<{ redirect: string }> {
  const { session, user } = await getCurrentPasswordResetSession();
  if (!session) throw new ClientError('Not authenticated');
  if (!session.emailVerified) throw new ClientError('Forbidden');
  if (!user.registeredSecurityKey) throw new ClientError('Forbidden');
  if (session.twoFactorVerified) throw new ClientError('Forbidden');

  await verifySecurityKeyHelper({ user, ...props });

  await setPasswordResetSessionAs2FAVerified(session.id);
  return { redirect: '/reset-password' };
}

async function verifySecurityKeyHelper(props: {
  user: User;
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}) {
  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) throw new ClientError('Invalid data');

  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) throw new ClientError('Invalid data');
  if (!authenticatorData.userPresent) throw new ClientError('Invalid data');

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) throw new ClientError('Invalid data');

  if (clientData.type !== ClientDataType.Get) throw new ClientError('Invalid data');

  if (!verifyWebAuthnChallenge(clientData.challenge)) throw new ClientError('Invalid data');

  if (clientData.origin !== env.SERVER_URL) throw new ClientError('Invalid data');
  if (clientData.crossOrigin !== null && clientData.crossOrigin) throw new ClientError('Invalid data');

  const credential = await getUserSecurityKeyCredential(props.user.id, props.credentialId);
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
    throw new ClientError('Internal error');
  }

  if (!validSignature) throw new ClientError('Invalid data');
}

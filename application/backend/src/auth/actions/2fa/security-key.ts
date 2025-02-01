import { safeTrySync } from '@acme/utils';
import {
  ClientDataType,
  coseAlgorithmES256,
  coseAlgorithmRS256,
  createAssertionSignatureMessage,
  parseAuthenticatorData,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { getCurrentSession, setSessionAs2FAVerified } from '../../services/session';
import { getUserSecurityKeyCredential, verifyWebAuthnChallenge } from '../../services/webauthn';
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from '@oslojs/crypto/ecdsa';
import { sha256 } from '@oslojs/crypto/sha2';
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from '@oslojs/crypto/rsa';

type Result = { message: string } | { redirect: string };

export async function verify2FAWithSecurityKey(props: {
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

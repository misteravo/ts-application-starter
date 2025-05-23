'use server';

import {
  getCurrentPasswordResetSession,
  getUserPasskeyCredential,
  setPasswordResetSessionAs2FAVerified,
  verifyWebAuthnChallenge,
} from '@acme/backend';
import { safeTrySync } from '@acme/utils';
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from '@oslojs/crypto/ecdsa';
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from '@oslojs/crypto/rsa';
import { sha256 } from '@oslojs/crypto/sha2';
import { decodeBase64 } from '@oslojs/encoding';
import {
  ClientDataType,
  coseAlgorithmES256,
  coseAlgorithmRS256,
  createAssertionSignatureMessage,
  parseAuthenticatorData,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { z } from 'zod';
import { env } from '~/env';
import { schemaAction } from '~/lib/safe-action';

const schema = z.object({
  authenticatorData: z.string(),
  clientData: z.string(),
  credentialId: z.string(),
  signature: z.string(),
});
export const verifyPasskeyAction = schemaAction(schema, async (props) => {
  const { session, user } = await getCurrentPasswordResetSession();
  if (session === null) return { error: 'Not authenticated' };
  if (!session.emailVerified || !user.registeredPasskey || session.twoFactorVerified) return { error: 'Forbidden' };

  const [decoded] = safeTrySync(() => ({
    authenticatorData: decodeBase64(props.authenticatorData),
    clientData: decodeBase64(props.clientData),
    credentialId: decodeBase64(props.credentialId),
    signature: decodeBase64(props.signature),
  }));
  if (!decoded) return { error: 'Invalid or missing fields' };

  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(decoded.authenticatorData));
  if (!authenticatorData) return { error: 'Invalid data' };

  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) {
    return { error: 'Invalid data' };
  }
  if (!authenticatorData.userPresent) return { error: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(decoded.clientData));
  if (!clientData) return { error: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { error: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { error: 'Invalid data' };
  if (clientData.origin !== env.SERVER_URL) return { error: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { error: 'Invalid data' };

  const credential = await getUserPasskeyCredential(user.id, decoded.credentialId);
  if (credential === null) return { error: 'Invalid credential' };

  let validSignature: boolean;
  if (credential.algorithmId === coseAlgorithmES256) {
    const ecdsaSignature = decodePKIXECDSASignature(decoded.signature);
    const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(decoded.authenticatorData, decoded.clientData));
    validSignature = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);
  } else if (credential.algorithmId === coseAlgorithmRS256) {
    const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
    const hash = sha256(createAssertionSignatureMessage(decoded.authenticatorData, decoded.clientData));
    validSignature = verifyRSASSAPKCS1v15Signature(rsaPublicKey, sha256ObjectIdentifier, hash, decoded.signature);
  } else {
    return { error: 'Internal error' };
  }

  if (!validSignature) return { error: 'Invalid data' };

  await setPasswordResetSessionAs2FAVerified(session.id);
  return { error: null };
});

import { safeTry, safeTrySync } from '@acme/utils';
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from '@oslojs/crypto/ecdsa';
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from '@oslojs/crypto/rsa';
import { sha256 } from '@oslojs/crypto/sha2';
import {
  ClientDataType,
  coseAlgorithmES256,
  coseAlgorithmRS256,
  createAssertionSignatureMessage,
  parseAuthenticatorData,
  parseClientDataJSON,
} from '@oslojs/webauthn';
import { getClientIP } from '../lib/headers';
import { get2FARedirect } from '../services/2fa';
import { verifyEmailInput } from '../services/email';
import { verifyPasswordHash } from '../services/password';
import { RefillingTokenBucket, Throttler } from '../services/rate-limit';
import { createSession, generateSessionToken, setSessionTokenCookie } from '../services/session';
import { getUserFromEmail, getUserPasswordHash } from '../services/user';
import { getPasskeyCredential, verifyWebAuthnChallenge } from '../services/webauthn';

const throttler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

type Result = { message: string } | { redirect: string };

export async function signIn(props: { email: string; password: string }): Promise<Result> {
  const { email, password } = props;

  const clientIP = await getClientIP();
  if (clientIP && !ipBucket.check(clientIP, 1)) return { message: 'Too many requests' };

  if (email === '' || password === '') return { message: 'Please enter your email and password.' };
  if (!verifyEmailInput(email)) return { message: 'Invalid email' };

  const [user] = await safeTry(getUserFromEmail(email));
  if (!user) return { message: 'Account does not exist' };

  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) return { message: 'Too many requests' };
  if (!throttler.consume(user.id)) return { message: 'Too many requests' };

  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) return { message: 'Invalid password' };

  throttler.reset(user.id);
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, { twoFactorVerified: false });
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  if (!user.emailVerified) return { redirect: '/verify-email' };
  if (!user.registered2FA) return { redirect: '/2fa/setup' };
  return { redirect: get2FARedirect(user) };
}

export async function signInWithPasskey(props: {
  authenticatorData: Uint8Array;
  clientData: Uint8Array;
  credentialId: Uint8Array;
  signature: Uint8Array;
}): Promise<Result> {
  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) return { message: 'Invalid data' };

  // TODO: Update host
  if (!authenticatorData.verifyRelyingPartyIdHash('localhost')) return { message: 'Invalid data' };
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) return { message: 'Invalid data' };

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) return { message: 'Invalid data' };

  if (clientData.type !== ClientDataType.Get) return { message: 'Invalid data' };

  if (!verifyWebAuthnChallenge(clientData.challenge)) return { message: 'Invalid data' };
  // TODO: Update origin
  if (clientData.origin !== 'http://localhost:3000') return { message: 'Invalid data' };
  if (clientData.crossOrigin !== null && clientData.crossOrigin) return { message: 'Invalid data' };

  const credential = await getPasskeyCredential(props.credentialId);
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

  if (!validSignature) return { message: 'Invalid signature' };

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, credential.userId, { twoFactorVerified: true });
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return { redirect: '/' };
}

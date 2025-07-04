import { ClientError, safeTry, safeTrySync } from '@acme/utils';
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
import { env } from '../../env';
import { getClientIP } from '../../lib/headers';
import { get2FARedirect } from '../services/2fa';
import { verifyEmailInput } from '../services/email';
import { verifyPasswordHash } from '../services/password';
import { RefillingTokenBucket, Throttler } from '../services/rate-limit';
import { createSession, generateSessionToken, setSessionTokenCookie } from '../services/session';
import { getUserFromEmail, getUserPasswordHash } from '../services/user';
import { getPasskeyCredential, verifyWebAuthnChallenge } from '../services/webauthn';

const throttler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export async function signIn(props: { email: string; password: string }): Promise<{ redirect: string }> {
  const { email, password } = props;

  const clientIP = await getClientIP();
  if (clientIP && !ipBucket.check(clientIP, 1)) throw new ClientError('Too many requests');

  if (email === '' || password === '') throw new ClientError('Please enter your email and password.');
  if (!verifyEmailInput(email)) throw new ClientError('Invalid email');

  const [user] = await safeTry(getUserFromEmail(email));
  if (!user) throw new ClientError('Account does not exist');

  if (clientIP !== null && !ipBucket.consume(clientIP, 1)) throw new ClientError('Too many requests');
  if (!throttler.consume(user.id)) throw new ClientError('Too many requests');

  const passwordHash = await getUserPasswordHash(user.id);
  const validPassword = await verifyPasswordHash(passwordHash, password);
  if (!validPassword) throw new ClientError('Invalid password');

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
}): Promise<{ redirect: string }> {
  const [authenticatorData] = safeTrySync(() => parseAuthenticatorData(props.authenticatorData));
  if (!authenticatorData) throw new ClientError('Invalid data');

  if (!authenticatorData.verifyRelyingPartyIdHash(env.SERVER_HOST)) throw new ClientError('Invalid data');
  if (!authenticatorData.userPresent || !authenticatorData.userVerified) throw new ClientError('Invalid data');

  const [clientData] = safeTrySync(() => parseClientDataJSON(props.clientData));
  if (!clientData) throw new ClientError('Invalid data');

  if (clientData.type !== ClientDataType.Get) throw new ClientError('Invalid data');

  if (!verifyWebAuthnChallenge(clientData.challenge)) throw new ClientError('Invalid data');
  if (clientData.origin !== env.SERVER_URL) throw new ClientError('Invalid data');
  if (clientData.crossOrigin !== null && clientData.crossOrigin) throw new ClientError('Invalid data');

  const credential = await getPasskeyCredential(props.credentialId);
  if (credential === null) throw new ClientError('Invalid credential');

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

  if (!validSignature) throw new ClientError('Invalid signature');

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, credential.userId, { twoFactorVerified: true });
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return { redirect: '/' };
}

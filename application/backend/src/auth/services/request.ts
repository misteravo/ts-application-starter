import { getClientIP } from '../../lib/headers';
import { RefillingTokenBucket } from './rate-limit';

export const globalBucket = new RefillingTokenBucket<string>(100, 1);

export async function globalGETRateLimit() {
  const clientIP = await getClientIP();
  if (!clientIP) return true;
  return globalBucket.consume(clientIP, 1);
}

export async function globalPOSTRateLimit() {
  const clientIP = await getClientIP();
  if (!clientIP) return true;
  return globalBucket.consume(clientIP, 3);
}

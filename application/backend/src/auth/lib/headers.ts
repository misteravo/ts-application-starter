import { headers } from 'next/headers';

export { cookies } from 'next/headers';

export async function getClientIP() {
  const headersList = await headers();
  // TODO: Assumes X-Forwarded-For is always included.
  const clientIP = headersList.get('X-Forwarded-For');
  return clientIP;
}

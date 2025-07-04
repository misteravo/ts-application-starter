import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  server: {
    // DATABASE_URL: z.string().url().optional(),
    SERVER_HOST: z.string().default('localhost'),
    SERVER_URL: z.string().default('http://localhost:3000'),
  },
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  runtimeEnv: {
    ...process.env,
    SERVER_HOST: process.env.SERVER_HOST,
    SERVER_URL: process.env.SERVER_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
});

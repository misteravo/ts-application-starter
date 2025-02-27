import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  server: {
    ENCRYPTION_KEY: z.string(),
    COOKIE_SECURE: z.boolean(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.number().default(25),
    MAIL_FROM: z.string(),
    REPLY_TO: z.string(),
    DEV_EMAIL: z.string().optional(),
  },
  runtimeEnv: {
    ...process.env,
    COOKIE_SECURE: ['1', 'true'].includes(process.env.COOKIE_SECURE ?? ''),
  },
  emptyStringAsUndefined: true,
});

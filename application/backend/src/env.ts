import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  server: {
    ENCRYPTION_KEY: z.string(),
    COOKIE_SECURE: z.boolean(),

    SERVER_HOST: z.string().default('localhost'),
    SERVER_URL: z.string().default('http://localhost:3000'),

    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.string().default('25').transform(Number),
    MAIL_FROM: z.string(),
    REPLY_TO: z.string().optional(),
    DEV_EMAIL: z.string().optional(),
  },
  runtimeEnv: {
    ...process.env,
    COOKIE_SECURE: ['1', 'true'].includes(process.env.COOKIE_SECURE ?? ''),
  },
  emptyStringAsUndefined: true,
});

/// <reference types="node" />
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  casing: 'snake_case',
} satisfies Config;

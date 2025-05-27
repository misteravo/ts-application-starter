import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export { schema as s };

export const db = drizzle(sql, {
  schema,
  casing: 'snake_case',
});

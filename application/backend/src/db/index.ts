import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';
import * as schema from './schema';

export { schema as s };

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
});
export const db = drizzle({
  client: pool,
  schema,
  casing: 'snake_case',
});

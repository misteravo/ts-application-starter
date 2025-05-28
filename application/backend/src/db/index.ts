import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../env';

export { schema as s };

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
});
const db = drizzle({
  client: pool,
  schema,
  casing: 'snake_case',
});

export default db;

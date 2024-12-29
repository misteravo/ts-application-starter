import { drizzle } from 'drizzle-orm/better-sqlite3';
import betterSqlite3 from 'better-sqlite3';
import * as schema from './schema';

export { schema as s };

const sqlite = betterSqlite3('../../sqlite.db');

export const db = drizzle(sqlite, {
  schema,
  casing: 'snake_case',
});

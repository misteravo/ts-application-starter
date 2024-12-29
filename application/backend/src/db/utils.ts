import { sql } from 'drizzle-orm';

export function sqlNotNull<T>(column: T) {
  return sql<number>`CASE WHEN ${column} IS NOT NULL THEN 1 ELSE 0 END`.mapWith(Boolean);
}

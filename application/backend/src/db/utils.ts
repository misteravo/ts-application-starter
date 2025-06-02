import type { Query, SQLWrapper } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export function sqlNotNull<T>(column: T) {
  return sql<number>`CASE WHEN ${column} IS NOT NULL THEN 1 ELSE 0 END`.mapWith(Boolean);
}

type SqlQuery = {
  toSQL(): Query;
};
export function sqlString<S extends SqlQuery>(value: SQLWrapper | Query | S) {
  const query = getQuery(value);
  return query.params.reduce((query: string, parameter) => query.replace('?', String(parameter)), query.sql);
}

function getQuery<S extends SqlQuery>(value: SQLWrapper | Query | S): Query {
  if ('sql' in value) return value;
  if ('toSQL' in value) return value.toSQL();
  // For SQLWrapper types, we need to convert to a query format
  // This is a simplified approach - may need adjustment based on actual usage
  return { sql: '', params: [] };
}

export function isDbConnectionError(err: unknown): boolean {
  const e = err as { code?: string };
  return e?.code === 'ECONNREFUSED' || e?.code === 'ENOTFOUND' || e?.code === '57P03';
}

export function dbErrorResponse(err: unknown) {
  if (isDbConnectionError(err)) {
    return {
      status: 503,
      body: {
        error: 'Database is unavailable. Please ensure PostgreSQL is running and configured.',
        code: 'DB_UNAVAILABLE',
      },
    };
  }
  const pgErr = err as { code?: string };
  if (pgErr?.code === '42P01') {
    return {
      status: 503,
      body: {
        error: 'Database schema is missing. Run: npm run db:setup && npm run db:migrate && npm run db:seed',
        code: 'DB_SCHEMA_MISSING',
      },
    };
  }
  return null;
}

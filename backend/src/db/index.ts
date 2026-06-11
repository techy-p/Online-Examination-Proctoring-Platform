import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

type DbMode = 'postgres' | 'pglite';

declare global {
  // eslint-disable-next-line no-var
  var __invigiloPglite: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __invigiloDbInit: boolean | undefined;
}

let mode: DbMode | null = null;
let pool: Pool | null = null;
let pglite: PGlite | null = null;
let initialized = false;

async function tryPostgres(): Promise<boolean> {
  const testPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });
  try {
    await testPool.query('SELECT 1');
    pool = testPool;
    mode = 'postgres';
    return true;
  } catch {
    await testPool.end().catch(() => {});
    return false;
  }
}

async function initPGlite() {
  if (global.__invigiloPglite) {
    pglite = global.__invigiloPglite;
    mode = 'pglite';
    initialized = true;
    return;
  }

  const dataDir = process.env.VERCEL
    ? path.join('/tmp', 'invigilo-pglite')
    : path.join(process.cwd(), 'data', 'pglite');
  fs.mkdirSync(dataDir, { recursive: true });
  pglite = new PGlite(dataDir);
  global.__invigiloPglite = pglite;
  mode = 'pglite';

  const tableCheck = await pglite.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
  );
  const hasUsers = tableCheck.rows[0]?.exists;

  if (!hasUsers) {
    const schemaPath = [
      path.join(__dirname, 'schema.sql'),
      path.join(process.cwd(), 'src', 'db', 'schema.sql'),
    ].find((candidate) => fs.existsSync(candidate));
    if (!schemaPath) {
      throw new Error('Database schema file could not be found');
    }
    const schema = fs.readFileSync(schemaPath, 'utf-8')
      .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\s*/i, '')
      .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
    await pglite.exec(schema);
    console.log('PGlite: schema initialized');

    const { default: runSeed } = await import('./seedInline');
    await runSeed(pglite);
    console.log('PGlite: seed data loaded');
  }
}

export async function initDatabase() {
  if (initialized || global.__invigiloDbInit) {
    initialized = true;
    if (global.__invigiloPglite && !pglite) {
      pglite = global.__invigiloPglite;
      mode = 'pglite';
    }
    return;
  }

  const forcePGlite = process.env.USE_PGLITE === 'true';
  if (!forcePGlite && await tryPostgres()) {
    console.log('Database: PostgreSQL connected');
  } else {
    console.log('Database: PostgreSQL unavailable — using embedded PGlite (./data/pglite)');
    await initPGlite();
  }
  initialized = true;
  global.__invigiloDbInit = true;
}

export function getDbMode() {
  return mode;
}

export const query = async (text: string, params?: unknown[]) => {
  if (!initialized) await initDatabase();

  try {
    if (mode === 'pglite' && pglite) {
      return await pglite.query(text, params);
    }
    return await pool!.query(text, params);
  } catch (err) {
    throw err;
  }
};

export async function closeDatabase() {
  if (mode === 'postgres' && pool) await pool.end();
  if (mode === 'pglite' && pglite) await pglite.close();
  initialized = false;
}

export default { query, initDatabase, closeDatabase, getDbMode };

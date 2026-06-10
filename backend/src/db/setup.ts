import fs from 'fs';
import path from 'path';
import { initDatabase, query, closeDatabase } from './index';

async function setup() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await initDatabase();
    await query(schema);
    console.log('Database schema created successfully.');
  } catch (err) {
    console.error('Schema setup failed:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

setup();

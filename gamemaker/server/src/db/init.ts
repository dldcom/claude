import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase(): Promise<void> {
  const schemaPath = join(__dirname, 'schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');

  console.log('Initializing database schema...');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Database schema initialized successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

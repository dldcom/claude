import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testDatabaseUrl = (process.env.DATABASE_URL ?? 'postgresql://localhost/lpc_rpg').replace(
  '/lpc_rpg',
  '/lpc_rpg_test',
);

export const testPool = new pg.Pool({ connectionString: testDatabaseUrl });

export async function setupTestDB(): Promise<void> {
  const schemaPath = join(__dirname, '..', 'src', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  await testPool.query(schema);
}

export async function cleanTestDB(): Promise<void> {
  await testPool.query(`
    TRUNCATE TABLE
      quiz_attempts,
      student_items,
      student_progress,
      items,
      questions,
      npcs,
      regions,
      students,
      classes,
      teachers
    CASCADE
  `);
}

export async function teardownTestDB(): Promise<void> {
  await testPool.end();
}

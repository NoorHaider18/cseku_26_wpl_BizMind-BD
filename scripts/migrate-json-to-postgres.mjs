import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for JSON → PostgreSQL migration.');

const source = process.argv[2] || path.resolve(process.cwd(), 'data/sme_db.json');
if (!fs.existsSync(source)) throw new Error(`Source JSON database not found: ${source}`);
const data = JSON.parse(fs.readFileSync(source, 'utf8'));

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DB_POOL_SIZE) || 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS bizmind_state (id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query('INSERT INTO bizmind_state (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()', [JSON.stringify(data)]);
  console.log(`Migrated ${source} to PostgreSQL successfully.`);
} finally {
  await pool.end();
}

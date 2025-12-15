
CONTENT
import { Pool } from "pg";

let pool: Pool | null = null;

/**

Setup de BD para tests de integración.

Conecta a Supabase (instancia de test) usando TEST_DATABASE_URL.
*/
export async function initTestDb(): Promise<Pool> {
if (pool) return pool;

const connectionString =
process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
throw new Error(
"TEST_DATABASE_URL o DATABASE_URL deben estar definidas para tests de integración"
);
}

const useSsl = process.env.SUPABASE_SSL === "true";

pool = new Pool({
connectionString,
ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

await pool.query("SELECT 1");
return pool;
}

export async function truncateTestDb(): Promise<void> {
if (!pool) return;

await pool.query(
TRUNCATE TABLE message_log, event_log, lead_draft, chat_session RESTART IDENTITY CASCADE;
);
}

export async function closeTestDb(): Promise<void> {
if (!pool) return;
await pool.end();
pool = null;
}


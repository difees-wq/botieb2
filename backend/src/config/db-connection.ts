import { Pool } from 'pg';
import { loadAppConfig } from '../config/app-config';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const cfg = loadAppConfig();

    const connectionString =
      process.env.DATABASE_URL || cfg.supabaseUrl; // usar DATABASE_URL como prioridad

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }  // Necesario para Supabase
    });
  }

  return pool;
}

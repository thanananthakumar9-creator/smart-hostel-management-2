import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../config';

export async function runPgMigration(): Promise<void> {
  const pool = new Pool(
    config.databaseUrl
      ? { connectionString: config.databaseUrl }
      : {
          host: config.pg.host,
          port: config.pg.port,
          user: config.pg.user,
          password: config.pg.password,
          database: config.pg.database,
        }
  );

  try {
    console.log('Connecting to PostgreSQL database...');
    const migrationPath = path.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Executing migration from ${migrationPath}...`);
    await pool.query(sql);
    console.log('✓ PostgreSQL migration completed successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runPgMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

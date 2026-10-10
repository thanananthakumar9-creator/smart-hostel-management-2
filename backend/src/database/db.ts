import { Pool, PoolConfig } from 'pg';
import { createClient, Client as LibsqlClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export type DbType = 'postgres' | 'sqlite';

let activeDbType: DbType = 'sqlite';
let pgPool: Pool | null = null;
let sqliteClient: LibsqlClient | null = null;

export async function getDbConnection(): Promise<{ type: DbType }> {
  // If already established
  if (pgPool) return { type: 'postgres' };
  if (sqliteClient) return { type: 'sqlite' };

  // Try PostgreSQL if configured
  if (config.databaseUrl || process.env.USE_POSTGRES === 'true') {
    try {
      const poolConfig: PoolConfig = config.databaseUrl
        ? { connectionString: config.databaseUrl, connectionTimeoutMillis: 3000 }
        : {
            host: config.pg.host,
            port: config.pg.port,
            user: config.pg.user,
            password: config.pg.password,
            database: config.pg.database,
            connectionTimeoutMillis: 3000,
          };

      const testPool = new Pool(poolConfig);
      await testPool.query('SELECT 1');
      pgPool = testPool;
      activeDbType = 'postgres';
      console.log('✓ Successfully connected to PostgreSQL Database.');
      return { type: 'postgres' };
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection failed (' + err.message + '). Falling back to embedded LibSQL/SQLite database.');
      pgPool = null;
    }
  }

  // Fallback to embedded SQLite
  const dbDir = path.dirname(config.sqliteDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const url = `file:${config.sqliteDbPath.replace(/\\/g, '/')}`;
  sqliteClient = createClient({ url });
  activeDbType = 'sqlite';
  console.log(`✓ Using Embedded Relational Database at ${config.sqliteDbPath}`);
  return { type: 'sqlite' };
}

export function getActiveDbType(): DbType {
  return activeDbType;
}

/**
 * Execute a query that returns multiple rows.
 * Parameter placeholders must use PostgreSQL format ($1, $2, ...).
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  await getDbConnection();

  if (activeDbType === 'postgres' && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows as T[];
  }

  if (sqliteClient) {
    // Translate $1, $2, ... to ? for SQLite
    const translatedSql = sql.replace(/\$(\d+)/g, '?');
    const res = await sqliteClient.execute({
      sql: translatedSql,
      args: params,
    });
    return res.rows as unknown as T[];
  }

  throw new Error('Database not initialized');
}

/**
 * Execute a query that returns a single row or null.
 */
export async function queryRow<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, DELETE or DDL statement.
 */
export async function execute(sql: string, params: any[] = []): Promise<{ rowsAffected: number }> {
  await getDbConnection();

  if (activeDbType === 'postgres' && pgPool) {
    const res = await pgPool.query(sql, params);
    return { rowsAffected: res.rowCount || 0 };
  }

  if (sqliteClient) {
    const translatedSql = sql.replace(/\$(\d+)/g, '?');
    const res = await sqliteClient.execute({
      sql: translatedSql,
      args: params,
    });
    return { rowsAffected: res.rowsAffected };
  }

  throw new Error('Database not initialized');
}

/**
 * Schema initialization supporting both PostgreSQL and SQLite dialect.
 */
export async function initSchema(): Promise<void> {
  await getDbConnection();

  const isPg = activeDbType === 'postgres';

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      identifier VARCHAR(64),
      phone VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL CHECK (role IN ('student', 'parent', 'tutor', 'warden', 'security', 'admin')),
      status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,

    `CREATE TABLE IF NOT EXISTS hostels (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius REAL NOT NULL DEFAULT 100.0,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(64) PRIMARY KEY,
      hostel_id VARCHAR(64) NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
      room_number VARCHAR(50) NOT NULL,
      capacity INT DEFAULT 4,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hostel_id, room_number)
    );`,

    `CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);`,

    `CREATE TABLE IF NOT EXISTS parents (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS tutors (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      employee_id VARCHAR(64),
      department VARCHAR(100),
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      register_number VARCHAR(50) UNIQUE NOT NULL,
      department VARCHAR(100) NOT NULL,
      year INT NOT NULL DEFAULT 1,
      room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
      parent_id VARCHAR(64) REFERENCES parents(id) ON DELETE SET NULL,
      tutor_id VARCHAR(64) REFERENCES tutors(id) ON DELETE SET NULL,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_students_reg ON students(register_number);`,
    `CREATE INDEX IF NOT EXISTS idx_students_tutor ON students(tutor_id);`,
    `CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);`,
    `CREATE INDEX IF NOT EXISTS idx_students_room ON students(room_id);`,

    `CREATE TABLE IF NOT EXISTS outpass_requests (
      id VARCHAR(64) PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      purpose VARCHAR(100) NOT NULL,
      destination VARCHAR(200) NOT NULL,
      reason TEXT NOT NULL,
      leaving_date VARCHAR(20) NOT NULL,
      leaving_time VARCHAR(20) NOT NULL,
      return_date VARCHAR(20) NOT NULL,
      return_time VARCHAR(20) NOT NULL,
      attachment_url TEXT,
      qr_token VARCHAR(100) UNIQUE,
      status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED')),
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_outpass_student ON outpass_requests(student_id);`,
    `CREATE INDEX IF NOT EXISTS idx_outpass_status ON outpass_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_outpass_qr_token ON outpass_requests(qr_token);`,

    `CREATE TABLE IF NOT EXISTS outpass_approvals (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL REFERENCES outpass_requests(id) ON DELETE CASCADE,
      approver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      approver_role VARCHAR(20) NOT NULL CHECK (approver_role IN ('tutor', 'parent', 'warden')),
      status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
      comments TEXT,
      approved_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'},
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(request_id, approver_role)
    );`,

    `CREATE INDEX IF NOT EXISTS idx_approvals_request ON outpass_approvals(request_id);`,
    `CREATE INDEX IF NOT EXISTS idx_approvals_approver ON outpass_approvals(approver_id);`,

    `CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(64) PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date VARCHAR(20) NOT NULL,
      time VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'NOT_VERIFIED', 'ABSENT')),
      latitude REAL,
      longitude REAL,
      verification_method VARCHAR(50) DEFAULT 'GEOFENCE_GPS',
      distance_from_hostel REAL,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    );`,

    `CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);`,

    `CREATE TABLE IF NOT EXISTS issues (
      id VARCHAR(64) PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'Water', 'Internet', 'Furniture', 'Cleaning', 'Room Maintenance', 'Other')),
      description TEXT NOT NULL,
      photo_url TEXT,
      priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED')),
      assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_issues_student ON issues(student_id);`,
    `CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);`,
    `CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);`,

    `CREATE TABLE IF NOT EXISTS issue_updates (
      id VARCHAR(64) PRIMARY KEY,
      issue_id VARCHAR(64) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      updated_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      status VARCHAR(20),
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_issue_updates_issue ON issue_updates(issue_id);`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      is_read ${isPg ? 'BOOLEAN' : 'INTEGER'} DEFAULT 0,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(64),
      details TEXT,
      created_at ${isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TEXT'} DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`,
  ];

  for (const stmt of schemaStatements) {
    if (activeDbType === 'postgres' && pgPool) {
      await pgPool.query(stmt);
    } else if (sqliteClient) {
      await sqliteClient.execute(stmt);
    }
  }

  // Safe migration for existing databases to ensure columns exist
  try {
    if (activeDbType === 'postgres' && pgPool) {
      await pgPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS identifier VARCHAR(64);`);
      await pgPool.query(`ALTER TABLE tutors ADD COLUMN IF NOT EXISTS employee_id VARCHAR(64);`);
    } else if (sqliteClient) {
      try {
        await sqliteClient.execute(`ALTER TABLE users ADD COLUMN identifier TEXT;`);
      } catch (e) {
        // column already exists
      }
      try {
        await sqliteClient.execute(`ALTER TABLE tutors ADD COLUMN employee_id TEXT;`);
      } catch (e) {
        // column already exists
      }
    }
    const idxStmt = `CREATE INDEX IF NOT EXISTS idx_users_identifier ON users(identifier);`;
    if (activeDbType === 'postgres' && pgPool) {
      await pgPool.query(idxStmt);
    } else if (sqliteClient) {
      await sqliteClient.execute(idxStmt);
    }
  } catch (err: any) {
    // Ignore migration warning
  }

  console.log('✓ Database schema initialized successfully.');
}

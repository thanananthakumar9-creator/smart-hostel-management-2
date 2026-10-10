import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local .env

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'smart_hostel_super_secure_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // PostgreSQL configuration
  databaseUrl: process.env.DATABASE_URL || '',
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'smart_hostel',
  },
  
  // Embedded fallback
  sqliteDbPath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/hostel.db'),
  
  // Default Geofence parameters (for testing or initial seed)
  defaultGeofence: {
    name: 'Main Campus Hostel Block A',
    latitude: 11.016844, // Sample Campus Latitude (e.g. Coimbatore / Tech Campus)
    longitude: 76.955832,
    radius: 150.0, // 150 meters
  }
};

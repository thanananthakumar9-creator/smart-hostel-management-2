"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPgMigration = runPgMigration;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const config_1 = require("../config");
async function runPgMigration() {
    const pool = new pg_1.Pool(config_1.config.databaseUrl
        ? { connectionString: config_1.config.databaseUrl }
        : {
            host: config_1.config.pg.host,
            port: config_1.config.pg.port,
            user: config_1.config.pg.user,
            password: config_1.config.pg.password,
            database: config_1.config.pg.database,
        });
    try {
        console.log('Connecting to PostgreSQL database...');
        const migrationPath = path_1.default.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
        const sql = fs_1.default.readFileSync(migrationPath, 'utf8');
        console.log(`Executing migration from ${migrationPath}...`);
        await pool.query(sql);
        console.log('✓ PostgreSQL migration completed successfully.');
    }
    catch (error) {
        console.error('Migration failed:', error.message);
        throw error;
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    runPgMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const db_1 = require("./database/db");
const seed_1 = require("./scripts/seed");
async function startServer() {
    try {
        console.log('--- Starting Smart Hostel Management Backend Server ---');
        // Initialize Schema & Seed Data
        await (0, db_1.initSchema)();
        await (0, seed_1.runSeed)();
        const server = app_1.app.listen(config_1.config.port, () => {
            console.log(`=======================================================`);
            console.log(`🚀 Smart Hostel API Server running on port ${config_1.config.port}`);
            console.log(`   Health: http://localhost:${config_1.config.port}/api/health`);
            console.log(`   Environment: ${config_1.config.nodeEnv}`);
            console.log(`=======================================================`);
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
            });
        });
    }
    catch (error) {
        console.error('Fatal error starting server:', error);
        process.exit(1);
    }
}
startServer();

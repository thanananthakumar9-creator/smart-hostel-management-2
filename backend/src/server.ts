import { app } from './app';
import { config } from './config';
import { initSchema } from './database/db';
import { runSeed } from './scripts/seed';

async function startServer() {
  try {
    console.log('--- Starting Smart Hostel Management Backend Server ---');
    
    // Initialize Schema & Seed Data
    await initSchema();
    await runSeed();

    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Smart Hostel API Server running on port ${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/api/health`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`=======================================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();

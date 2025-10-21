import app from './app.js';
import config from './config/index.js';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(config.server.port, config.server.host, () => {
      console.log('🚀 Server started successfully');
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🌐 Server running at http://${config.server.host}:${config.server.port}`);
      console.log(`🔗 API endpoint: http://${config.server.host}:${config.server.port}/api`);
      console.log(`❤️  Health check: http://${config.server.host}:${config.server.port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

import './config/environment.js';
import { initializeServerDiagnostics, reportStartupFailure } from './services/sentry.js';

initializeServerDiagnostics();

try {
  const { startServer } = await import('./start-server.js');
  await startServer();
} catch (error) {
  console.error('❌ Failed to start server:', error);
  await reportStartupFailure(error);
  process.exit(1);
}

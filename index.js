import './src/config/env.js';
import { startServer } from './src/server.js';

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

import http from 'node:http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { cache } from './common/cache/cache.service.js';
import { initSocket } from './modules/socket/socket.js';

export async function startServer() {
  await connectDatabase();
  await cache.init();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`API server listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal}: shutting down`);
    server.close(async () => {
      await cache.close();
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

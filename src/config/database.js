import mongoose from 'mongoose';
import env from './env.js';
import dns from "dns";

dns.setServers([
  process.env.DNS_PRIMARY || "8.8.8.8",
  process.env.DNS_SECONDARY || "8.8.4.4",
]);
export async function connectDatabase() {
  if (!env.mongoUri) throw new Error('MONGO_URI is not configured');

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT || 10000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT || 45000),
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

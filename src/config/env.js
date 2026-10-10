import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../config/.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || process.env.ENV || 'production',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.tokenSignature || process.env.JWTKEY,
  bearerKey: process.env.BearerKey || 'Bearer',
  bcryptRounds: Number(process.env.ROUNDS || process.env.SALTROUND || 10),
  cloudinary: {
    cloudName: process.env.cloud_name,
    apiKey: process.env.api_key,
    apiSecret: process.env.api_secret,
  },
  mail: {
    user: process.env.nodeMailerEmail,
    password: process.env.nodeMailerPassword,
  },
  redisUrl: process.env.REDIS_URL || '',
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheDefaultTtl: Number(process.env.CACHE_DEFAULT_TTL || 30),
};

export default env;

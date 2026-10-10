import env from '../../config/env.js';
import { RedisClient } from './redis.client.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.memory = new Map();
    this.enabled = Boolean(env.cacheEnabled);
  }

  async init() {
    if (!this.enabled || !env.redisUrl) return;
    try {
      this.redis = new RedisClient(env.redisUrl);
      await this.redis.connect();
      console.log('Redis cache connected');
    } catch (error) {
      this.redis = null;
      console.warn('Redis unavailable; using in-memory cache:', error.message);
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    if (this.redis?.connected) {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    }

    const item = this.memory.get(key);
    if (!item || item.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = env.cacheDefaultTtl) {
    if (!this.enabled) return;
    if (this.redis?.connected) {
      await this.redis.set(key, JSON.stringify(value), ttlSeconds);
      return;
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key) {
    if (this.redis?.connected) await this.redis.del(key);
    this.memory.delete(key);
  }

  async delByPrefix(prefix) {
    if (this.redis?.connected) {
      let cursor = '0';
      do {
        const result = await this.redis.scan(cursor, `${prefix}*`);
        cursor = String(result?.[0] ?? '0');
        const keys = result?.[1] || [];
        if (keys.length) await this.redis.del(keys);
      } while (cursor !== '0');
    }
    for (const key of this.memory.keys()) if (key.startsWith(prefix)) this.memory.delete(key);
  }

  async close() {
    await this.redis?.quit();
    this.redis = null;
    this.memory.clear();
  }
}

export const cache = new CacheService();

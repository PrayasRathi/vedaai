import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const tlsOptions = redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 15000,
  commandTimeout: 10000,
  tls: tlsOptions,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 1000, 5000);
  },
});

export const redisClient = new IORedis(redisUrl, {
  connectTimeout: 15000,
  commandTimeout: 10000,
  tls: tlsOptions,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 1000, 3000);
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.log('⚠️ Redis unavailable:', err.message));
redisClient.on('error', () => { });
import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 500, 5000),
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

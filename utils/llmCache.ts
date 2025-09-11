import { setCache, getCache } from './redisClient';

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export async function setLLMCache(key: string, result: any, ttl: number = DEFAULT_TTL_MS) {
  // Convert milliseconds to seconds for Redis
  const ttlSeconds = Math.floor(ttl / 1000);
  await setCache(key, result, ttlSeconds);
}

export async function getLLMCache(key: string): Promise<any | null> {
  return await getCache(key);
}

// Note: Redis automatically handles expiration, so we don't need a clear function
// But we'll keep this for compatibility
export async function clearLLMCache() {
  // In a Redis implementation, we might want to clear only LLM cache entries
  // For now, we'll leave this as a no-op since we don't have a way to selectively clear
  console.log('[LLMCache] Clear operation not implemented for Redis - use redisClient.clearCache() to clear all');
}
// Simple in-memory cache for LLM calls (prod: use Redis)
// Key: string (hash of input/prompt/type)
// Value: { result: any, expires: number }

const cache = new Map<string, { result: any, expires: number }>();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function setLLMCache(key: string, result: any, ttl: number = DEFAULT_TTL_MS) {
  cache.set(key, { result, expires: Date.now() + ttl });
}

export function getLLMCache(key: string): any | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.result;
  }
  if (entry) cache.delete(key);
  return null;
}

export function clearLLMCache() {
  cache.clear();
}

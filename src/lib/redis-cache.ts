import { createHash } from 'node:crypto';

type CacheEntry = {
  value: unknown;
  expiresAt: number | null;
};

const memoryCache = (() => {
  const globalScope = globalThis as typeof globalThis & {
    __orchidsMemoryCache?: Map<string, CacheEntry>;
  };
  if (!globalScope.__orchidsMemoryCache) {
    globalScope.__orchidsMemoryCache = new Map<string, CacheEntry>();
  }
  return globalScope.__orchidsMemoryCache;
})();

export const DEFAULT_CACHE_TTL_SECONDS = 10;

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function buildCacheKey(prefix: string, url: string) {
  return `${prefix}:${hashKey(url)}`;
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCachedValue<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
): Promise<void> {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    memoryCache.delete(key);
    return;
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

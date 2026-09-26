interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  // Fresh for 60 seconds
  if (Date.now() - entry.timestamp < 60000) {
    return entry.data as T;
  }
  return null;
}

export function setCache(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCachePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function generateCacheKey(method: string, path: string, subject: string) {
  return `${method}:${path}:${subject}`;
}

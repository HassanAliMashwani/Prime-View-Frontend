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

const inFlightRequests = new Map<string, Promise<any>>();

export async function fetchWith60sCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      if (data !== undefined && data !== null) {
        setCache(key, data);
      }
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export function generateCacheKey(method: string, path: string, subject: string) {
  return `${method}:${path}:${subject}`;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCache<T>(key: string, allowStale = false): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  // Fresh for 60 seconds unless stale is permitted
  if (allowStale || Date.now() - entry.timestamp < 60000) {
    return entry.data as T;
  }
  return null;
}

export function peekCache<T>(key: string): T | null {
  const entry = cache.get(key);
  return entry ? (entry.data as T) : null;
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
    } catch (err) {
      // Keep existing data in cache on background failure
      const existing = cache.get(key);
      if (existing) {
        return existing.data as T;
      }
      throw err;
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

/**
 * Reconciles two lists of items by identifier:
 * - Matches items by id
 * - Swaps changed items in place while preserving unchanged item references
 * - Appends newly arrived items
 * - Removes deleted items
 * - If incoming list is empty (failed or unusable background fetch), keeps current list
 * - If nothing changed, preserves array identity so React does not move or re-render
 */
export function reconcileItems<T>(
  currentList: T[],
  incomingList: T[],
  getId: (item: T) => string,
  isEqual: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)
): T[] {
  if (!incomingList || incomingList.length === 0) {
    return currentList;
  }
  if (!currentList || currentList.length === 0) {
    return incomingList;
  }

  const incomingMap = new Map<string, T>();
  incomingList.forEach((item) => {
    incomingMap.set(getId(item), item);
  });

  let hasChanged = false;
  const result: T[] = [];

  // 1. Swap changed items in place, keep unchanged with identical reference, drop removed
  for (const current of currentList) {
    const id = getId(current);
    if (incomingMap.has(id)) {
      const incoming = incomingMap.get(id)!;
      if (isEqual(current, incoming)) {
        result.push(current);
      } else {
        result.push(incoming);
        hasChanged = true;
      }
    } else {
      hasChanged = true;
    }
  }

  // 2. Add newly arrived items
  const currentIdSet = new Set(currentList.map(getId));
  for (const incoming of incomingList) {
    const id = getId(incoming);
    if (!currentIdSet.has(id)) {
      result.push(incoming);
      hasChanged = true;
    }
  }

  return hasChanged ? result : currentList;
}

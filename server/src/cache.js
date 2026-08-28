// Tiny in-memory TTL cache. Good enough for a single-process dashboard.
// Swap for Redis if you ever run multiple server instances.

const store = new Map(); // key -> { value, expiresAt }

export function getCached(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function setCached(key, value, ttlSeconds) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

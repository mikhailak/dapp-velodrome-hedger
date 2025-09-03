import { LRUCache } from "lru-cache";

/** Значения кэшируем как объект-обёртку, чтобы удовлетворить constraint библиотеки */
type Box = { v: unknown };

export const cache = new LRUCache<string, Box>({
  max: 500,
  ttl: 30_000, // 30s
});

export async function memo<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit.v as T;

  const res = await fn();
  cache.set(key, { v: res }, { ttl });
  return res;
}

import { LRUCache } from "lru-cache";

// В v11 тип значения должен быть объектом (V extends {}).
// Нам нужно кэшировать любые типы (включая числа/строки).
// Поэтому используем `any` ТОЛЬКО внутри кеша и отдаем типизированно через memo<T>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 30_000, // default TTL для записей (перекрываем в set)
});

/**
 * Универсальная мемоизация по ключу с TTL.
 * Тип T сохраняется снаружи, внутри кеша — `any`, чтобы не упереться в ограничение V extends {}.
 */
export async function memo<T>(
  key: string,
  calc: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const hit = cache.get(key) as T | undefined;
  if (hit !== undefined) return hit;

  const val = await calc();
  cache.set(key, val, { ttl: ttlMs });
  return val;
}

// apps/backend-ts/src/services/pools.ts
import { graphQuery } from "../graph";
import { d, toFixedStr } from "../utils/num";
import { memo } from "../utils/cache";

type PoolTokens = {
  id: string;
  symbol: string;
  name: string;
  decimals: string; // от сабграфа как строка
};

export type PoolRaw = {
  id: string;
  tvlUSD: string;
  volumeUSD: string;
  feesUSD: string;
  tvlToken0: string;
  tvlToken1: string;
  feeTier: string;
  token0: PoolTokens;
  token1: PoolTokens;
};

export type PoolDayRaw = {
  id: string;         // "0xpool-YYYYMMDD"
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
};

export type PoolNormalized = {
  id: string;
  tvlUSD: string;
  volumeUSD: string;
  feesUSD: string;
  tvlToken0: string;
  tvlToken1: string;
  feeTier: string;
  token0: { id: string; symbol: string; name: string; decimals: number };
  token1: { id: string; symbol: string; name: string; decimals: number };
  // вычисленные поля
  dayId: string | null;
  fees24hUSD: string;
  apr24hPct: string;
};

/**
 * Нормализация pool + daypoint (если есть)
 */
function normalizePool(pool: PoolRaw, day?: PoolDayRaw | null): PoolNormalized {
  const fees24h = d(day?.feesUSD ?? 0);
  const tvl = d(pool.tvlUSD);
  const apr = tvl.gt(0) ? fees24h.mul(365).div(tvl).mul(100) : d(0);

  return {
    id: pool.id.toLowerCase(),
    tvlUSD: toFixedStr(pool.tvlUSD, 4),
    volumeUSD: toFixedStr(pool.volumeUSD, 4),
    feesUSD: toFixedStr(pool.feesUSD, 4),
    tvlToken0: toFixedStr(pool.tvlToken0, 6),
    tvlToken1: toFixedStr(pool.tvlToken1, 6),
    feeTier: pool.feeTier,
    token0: {
      id: pool.token0.id.toLowerCase(),
      symbol: pool.token0.symbol,
      name: pool.token0.name,
      decimals: Number(pool.token0.decimals),
    },
    token1: {
      id: pool.token1.id.toLowerCase(),
      symbol: pool.token1.symbol,
      name: pool.token1.name,
      decimals: Number(pool.token1.decimals),
    },
    dayId: day?.id ?? null,
    fees24hUSD: toFixedStr(fees24h, 2),
    apr24hPct: toFixedStr(apr, 2),
  };
}

/**
 * Получить пул по id.
 * Если передан dayId — подтягиваем daypoint и считаем APR/fees24h;
 * если нет — вернём только агрегаты пула.
 */
export async function fetchPoolById(id: string, dayId?: string | null): Promise<PoolNormalized> {
  const poolId = id.toLowerCase();

  // ВАЖНО: здесь правильно используем алиасы GraphQL:
  //   tvlUSD: totalValueLockedUSD
  //   tvlToken0: totalValueLockedToken0
  //   tvlToken1: totalValueLockedToken1
  const POOL_Q = /* GraphQL */ `
    query Pool($id: ID!) {
      pool(id: $id) {
        id
        tvlUSD: totalValueLockedUSD
        volumeUSD
        feesUSD
        tvlToken0: totalValueLockedToken0
        tvlToken1: totalValueLockedToken1
        feeTier
        token0 { id symbol name decimals }
        token1 { id symbol name decimals }
      }
    }
  `;

  const { pool } = await graphQuery<{ pool: PoolRaw | null }>(POOL_Q, { id: poolId });
  if (!pool) {
    throw new Error(`Pool not found: ${poolId}`);
  }

  // daypoint (опционально)
  let day: PoolDayRaw | null = null;
  if (dayId) {
    day = await fetchPoolDayById(poolId, dayId);
  }

  return normalizePool(pool, day);
}

/**
 * Получить daypoint по конкретному id (entity id).
 */
export async function fetchPoolDayById(poolId: string, dayId: string): Promise<PoolDayRaw | null> {
  const key = `poolDay:${dayId}`;
  return memo(key, async () => {
    const DAY_BY_ID_Q = /* GraphQL */ `
    query PoolDayById($id: ID!) {
      poolDayData(id: $id) {
        id
        date
        volumeUSD
        tvlUSD
        feesUSD
        pool { id }
      }
    }
  `;
  const { poolDayData } = await graphQuery<{ poolDayData: PoolDayRaw | null }>(DAY_BY_ID_Q, { id: dayId });
  // просто вернём то, что есть (null тоже ок)
  return poolDayData ?? null;
  }, 30_000);
}

/**
 * Получить последний доступный daypoint по пулу.
 * Мемоизация 30с (см. utils/cache).
 */
export async function fetchPoolDayLast(poolId: string): Promise<PoolDayRaw | null> {
  const key = `poolDayLast:${poolId.toLowerCase()}`;
  return memo(key, async () => {
    const LAST_DAY_Q = /* GraphQL */ `
    query PoolDaysLatest($poolId: String!) {
      poolDayDatas(
        first: 1
        orderBy: date
        orderDirection: desc
        where: { pool: $poolId }
      ) {
        id
        date
        volumeUSD
        tvlUSD
        feesUSD
        pool { id }
      }
    }
  `;
  const { poolDayDatas } = await graphQuery<{ poolDayDatas: PoolDayRaw[] }>(LAST_DAY_Q, {
    poolId: poolId.toLowerCase(),
  });
    return poolDayDatas?.[0] ?? null;
  }, 30_000);
}

/**
 * Получить последние N daypoints по пулу.
 */
export async function fetchPoolDays(poolId: string, last: number): Promise<PoolDayRaw[]> {
  const DAYS_Q = /* GraphQL */ `
  query PoolDays($poolId: String!, $n: Int!) {
    poolDayDatas(
      first: $n
      orderBy: date
      orderDirection: desc
      where: { pool: $poolId }
    ) {
      id
      date
      volumeUSD
      tvlUSD
      feesUSD
      pool { id }
    }
  }
`;
const { poolDayDatas } = await graphQuery<{ poolDayDatas: PoolDayRaw[] }>(DAYS_Q, {
  poolId: poolId.toLowerCase(),
  n: last,
});
  return poolDayDatas ?? [];
}

// apps/backend-ts/src/services/pools.ts
import { graphQuery } from "../graph";
import { POOL_QUERY } from "../queries/pool";
import { POOL_DAY_BY_ID_QUERY, POOL_DAY_LAST_QUERY } from "../queries/poolDay";

export type TokenInfo = {
  id: string;
  symbol: string;
  name?: string | null;
  decimals?: string | null;
};

export type Pool = {
  id: string;
  totalValueLockedUSD?: string | null;
  volumeUSD?: string | null;
  feesUSD?: string | null;
  totalValueLockedToken0?: string | null;
  totalValueLockedToken1?: string | null;
  feeTier?: string | null;
  token0?: TokenInfo | null;
  token1?: TokenInfo | null;
};

type PoolQueryResult = { pool: Pool | null };

export async function fetchPoolById(id: string): Promise<Pool | null> {
  const data = await graphQuery<PoolQueryResult>(POOL_QUERY, {
    id: id.toLowerCase(),
  });
  return data.pool;
}

export type PoolDayPoint = {
  id: string;
  date?: number | null;
  tvlUSD?: string | null;
  volumeUSD?: string | null;
  feesUSD?: string | null;
};

type PoolDayByIdRes = { poolDayData: PoolDayPoint | null };

// НОВЫЙ тип: entity-level ответ, а не через pool{dayData}
type PoolDayLastRes = { poolDayDatas: PoolDayPoint[] };

export async function fetchPoolDayById(dayId: string): Promise<PoolDayPoint | null> {
  const data = await graphQuery<PoolDayByIdRes>(POOL_DAY_BY_ID_QUERY, { id: dayId });
  return data.poolDayData ?? null;
}

export async function fetchPoolDayLast(poolId: string): Promise<PoolDayPoint | null> {
  const data = await graphQuery<PoolDayLastRes>(POOL_DAY_LAST_QUERY, {
    poolId: poolId.toLowerCase(),
  });

  // если коллекция пустая — вернём null
  return data.poolDayDatas?.[0] ?? null;

  /**
   * ⚠️ Если твой сабграф требует вложенный фильтр (встречается в некоторых схемах),
   * то запрос должен быть такой:
   *
   *   query PoolDayLast($poolId: String!) {
   *     poolDayDatas(
   *       first: 1
   *       orderBy: date
   *       orderDirection: desc
   *       where: { pool_: { id: $poolId } }
   *     ) { ... }
   *   }
   *
   * Тогда поменяй только WHERE в POOL_DAY_LAST_QUERY и оставь остальной код.
   */
}

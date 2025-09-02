import { graphQuery } from "../graph";
import { POOL_QUERY } from "../queries/pool";

export type TokenInfo = {
  id: string;
  symbol: string;
  name?: string | null;
  decimals?: string | null; // часто приходит строкой
};

export type Pool = {
  id: string;
  totalValueLockedUSD?: string | null;
  volumeUSD?: string | null;
  feesUSD?: string | null;
  totalValueLockedToken0?: string | null;
  totalValueLockedToken1?: string | null;
  feeTier?: string | null; // иногда string, иногда int — оставим string | null
  token0?: TokenInfo | null;
  token1?: TokenInfo | null;
};

type PoolQueryResult = {
  pool: Pool | null;
};

export async function fetchPoolById(id: string): Promise<Pool | null> {
  // чаще всего id пула в сабграфе хранится в lowercase
  const data = await graphQuery<PoolQueryResult>(POOL_QUERY, { id: id.toLowerCase() });
  return data.pool;
}

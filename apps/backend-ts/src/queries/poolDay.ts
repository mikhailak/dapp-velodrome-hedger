// apps/backend-ts/src/queries/poolDay.ts

// Берём day-точку по конкретному dayId:
export const POOL_DAY_BY_ID_QUERY = /* GraphQL */ `
  query PoolDayById($id: ID!) {
    poolDayData(id: $id) {
      id
      date
      tvlUSD
      volumeUSD
      feesUSD
    }
  }
`;

// Fallback: «последний день» НЕ через поле пула, а по коллекции с фильтром по pool
// Обрати внимание: тип переменной $poolId — String! (а не ID),
// т.к. в большинстве схем поле pool в poolDayData хранится как строковый id пула.
// Если у конкретного сабграфа нужно иначе (например, pool_: { id: $poolId }),
// см. комментарий ниже в services/pools.ts.
export const POOL_DAY_LAST_QUERY = /* GraphQL */ `
  query PoolDayLast($poolId: String!) {
    poolDayDatas(
      first: 1
      orderBy: date
      orderDirection: desc
      where: { pool: $poolId }
    ) {
      id
      date
      tvlUSD
      volumeUSD
      feesUSD
    }
  }
`;

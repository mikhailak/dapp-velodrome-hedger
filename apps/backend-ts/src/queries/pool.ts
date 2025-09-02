// Конкретный запрос под схему:
// id, token0/1, TVL (в USD и по токенам), объем, комиссии, feeTier
export const POOL_QUERY = /* GraphQL */ `
  query PoolById($id: ID!) {
    pool(id: $id) {
      id
      totalValueLockedUSD
      volumeUSD
      feesUSD
      totalValueLockedToken0
      totalValueLockedToken1
      feeTier
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
    }
  }
`;

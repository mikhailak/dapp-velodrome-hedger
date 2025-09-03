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
// apps/backend-ts/src/pools.live.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ── Типы ответов GraphQL, которые возвращаем из мока ─────────────────────────
type Token = { id: string; symbol: string; name: string; decimals: string };

type PoolGql = {
  id: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  feeTier: string;
  token0: Token;
  token1: Token;
};

type PoolByIdRes = { pool: PoolGql };

type DayPoint = {
  id: string;
  date: number;
  tvlUSD: string;
  volumeUSD: string;
  feesUSD: string;
};

type PoolDayByIdRes = { poolDayData: DayPoint };
// ⬇️ новая форма ответа для fallback: коллекция poolDayDatas
type PoolDayLastRes = { poolDayDatas: DayPoint[] };

// ── Мокаем модуль graph ДО импорта сервера ────────────────────────────────────
// ВАЖНО: путь из теста до src/graph.ts — "./graph" (т.е. тот же каталог "src")
vi.mock("./graph", async () => {
  type GraphQuery = <T>(
    query: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;

  const graphQuery: GraphQuery = async <T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> => {
    if (query.includes("query PoolById")) {
      const resp: PoolByIdRes = {
        pool: {
          id: "0xpool",
          totalValueLockedUSD: "12345.67",
          volumeUSD: "98765.43",
          feesUSD: "321.00",
          totalValueLockedToken0: "1000",
          totalValueLockedToken1: "2000",
          feeTier: "3000",
          token0: { id: "0xT0", symbol: "T0", name: "Token0", decimals: "18" },
          token1: { id: "0xT1", symbol: "T1", name: "Token1", decimals: "18" },
        },
      };
      return resp as unknown as T;
    }

    if (query.includes("query PoolDayById")) {
      const v = (variables ?? {}) as Record<string, unknown>;
      const dayId = typeof v.id === "string" ? v.id : "0xpool-unknown";
      const resp: PoolDayByIdRes = {
        poolDayData: {
          id: dayId,
          date: 1725148800,
          tvlUSD: "12000.00",
          volumeUSD: "2000.00",
          feesUSD: "6.00", // → APR24h = 6/12000=0.0005 → 0.05%, год ≈18.25%
        },
      };
      return resp as unknown as T;
    }

    if (query.includes("query PoolDayLast")) {
      // ⬇️ ВОТ ЗДЕСЬ главная правка: возвращаем poolDayDatas (а не pool{dayData})
      const resp: PoolDayLastRes = {
        poolDayDatas: [
          {
            id: "0xpool-20240902",
            date: 1725235200,
            tvlUSD: "12345.67",
            volumeUSD: "1000.00",
            feesUSD: "3.00", // → APR24h ≈ 0.0243%, год ≈ 8.86%
          },
        ],
      };
      return resp as unknown as T;
    }

    // fallback — не должен понадобиться
    const empty: PoolByIdRes = {
      pool: {
        id: "0xpool",
        totalValueLockedUSD: "0",
        volumeUSD: "0",
        feesUSD: "0",
        totalValueLockedToken0: "0",
        totalValueLockedToken1: "0",
        feeTier: "0",
        token0: { id: "0x0", symbol: "X", name: "X", decimals: "18" },
        token1: { id: "0x0", symbol: "Y", name: "Y", decimals: "18" },
      },
    };
    return empty as unknown as T;
  };

  return { graphQuery };
});

// Теперь можно импортировать сервер (после vi.mock)
import { buildServer } from "./server";

beforeEach(() => {
  process.env.GRAPH_API_KEY = "test-key";
  process.env.GRAPH_SUBGRAPH_ID = "test-subgraph";
});

afterEach(() => {
  delete process.env.GRAPH_API_KEY;
  delete process.env.GRAPH_SUBGRAPH_ID;
  vi.clearAllMocks();
});

describe("GET /pools/:id with dayId", () => {
  it("uses poolDayData(id) to compute APR", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/pools/0xPOOL?dayId=0xpool-20240901",
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body).toMatchObject({
      id: "0xpool",
      dayId: "0xpool-20240901",
      fees24hUSD: "6.00",
      apr24h: "0.05",
      aprYear: "18.25",
    });

    await app.close();
  });
});

describe("GET /pools/:id without dayId", () => {
  it("falls back to latest day point", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/pools/0xPOOL",
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body).toMatchObject({
      id: "0xpool",
      dayId: "0xpool-20240902",
      fees24hUSD: "3.00",
    });
    expect(Number(body.apr24h)).toBeGreaterThan(0);
    expect(Number(body.aprYear)).toBeGreaterThan(0);

    await app.close();
  });
});

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

const OLD_ENV = process.env;
beforeAll(() => {
  process.env = {
    ...OLD_ENV,
    GRAPH_API_KEY: "test-key",
    GRAPH_SUBGRAPH_ID: "test-subgraph",
  };
});
afterAll(() => {
  process.env = OLD_ENV;
});

// Мок ДОЛЖЕН быть объявлен до импорта buildServer
vi.mock("./graph", async () => {
    return {
      graphQuery: async (query: string) => {
      if (query.includes("poolDayDatas(")) {
        return {
          poolDayDatas: [
            {
              id: "0xpool-20240903",
              volumeUSD: "3000",
              tvlUSD: "7000",
              feesUSD: "70",
            },
            {
              id: "0xpool-20240902",
              volumeUSD: "2000",
              tvlUSD: "6000",
              feesUSD: "60",
            },
          ],
        };
      }
      if (query.includes("pool(")) {
        return {
          pool: {
            id: "0xpool",
            tvlUSD: "10000",
            volumeUSD: "3000",
            feesUSD: "100",
            tvlToken0: "5000",
            tvlToken1: "5000",
            feeTier: "500",
            token0: { id: "0xAAA", symbol: "AAA", name: "TokenAAA", decimals: "18" },
            token1: { id: "0xBBB", symbol: "BBB", name: "TokenBBB", decimals: "18" },
          },
        };
      }
      return {};
      },
    };
  });
  

import { buildServer } from "./server";

type DayPoint = {
  id: string;
  volumeUSD: string;
  tvlUSD: string;
  feesUSD: string;
};

describe("pools days routes", () => {
  it("GET /pools/:id/days > returns last N days", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/pools/0xPOOL/days?n=2" });
    if (res.statusCode !== 200) {
        // покажет, что вернул ваш error handler
        // иногда полезно посмотреть и JSON, и исходный body
        try {
          console.error("FAIL BODY (json):", res.json());
        } catch {
          console.error("FAIL BODY (raw):", res.body);
        }
      }
    expect(res.statusCode).toBe(200);
    const body = res.json() as DayPoint[];
    expect(body.length).toBe(2);
    expect(body[0].id).toBe("0xpool-20240903");
    expect(body[1].id).toBe("0xpool-20240902");
    await app.close();
  });

  it("GET /pools?ids=… > returns array of pools", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/pools?ids=0xAAA,0xBBB" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Array<Record<string, unknown>>;
    expect(Array.isArray(body)).toBe(true);
    await app.close();
  });
});

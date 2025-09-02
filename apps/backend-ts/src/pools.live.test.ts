// apps/backend-ts/src/pools.live.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildServer } from "./server";

beforeEach(() => {
  // ✅ выставляем фиктивные переменные окружения, чтобы getGraphEndpoint() не падал
  process.env.GRAPH_API_KEY = "test-key";
  process.env.GRAPH_SUBGRAPH_ID = "test-subgraph";

  // ✅ мок сети: graphQuery -> fetch(...) вернёт предсказуемый ответ
  vi.stubGlobal("fetch", vi.fn(async () => {
    return {
      ok: true,
      json: async () => ({
        data: {
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
        },
      }),
    } as any;
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GRAPH_API_KEY;
  delete process.env.GRAPH_SUBGRAPH_ID;
});

describe("GET /pools/:id", () => {
  it("returns normalized pool data", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/pools/0xPOOL" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      id: "0xpool",
      tvlUSD: "12345.67",
      volumeUSD: "98765.43",
      feesUSD: "321.00",
      feeTier: "3000",
      token0: { id: "0xT0", symbol: "T0" },
      token1: { id: "0xT1", symbol: "T1" },
    });
    await app.close();
  });
});

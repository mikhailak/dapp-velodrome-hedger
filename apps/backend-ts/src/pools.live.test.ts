import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";


// фиктивные env, чтобы код не падал на проверке конфигов
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
// мок Graph (ВАЖНО: путь именно "./graph", а не "../graph")



vi.mock("./graph", async () => {
  return {
    graphQuery: async (query: string, vars?: Record<string, unknown>) => {
      const has = (re: RegExp) => re.test(query);

      // Сначала plural: "последний daypoint"
      if (has(/\bpoolDayDatas\s*\(/)) {
        return {
          poolDayDatas: [
            {
              id: "0xpool-20240902",
              volumeUSD: "2000",
              tvlUSD: "6000",
              feesUSD: "60",
            },
          ],
        };
      }

      // Потом singular: учитываем vars.id
      if (has(/\bpoolDayData\s*\(/)) {
        const id = typeof vars?.id === "string" ? (vars!.id as string) : "0xpool-20240901";
        if (id.endsWith("20240902")) {
          return {
            poolDayData: {
              id,
              volumeUSD: "2000",
              tvlUSD: "6000",
              feesUSD: "60",
            },
          };
        }
        // дефолт: 20240901
        return {
          poolDayData: {
            id,
            volumeUSD: "1000",
            tvlUSD: "5000",
            feesUSD: "50",
          },
        };
      }

      // Данные пула
      if (has(/\bpool\s*\(/)) {
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

describe("pools live routes", () => {
  it("GET /pools/:id with dayId > uses poolDayData(id) to compute APR", async () => {
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
      fees24hUSD: "50.00",
    });
    await app.close();
  });

  it("GET /pools/:id without dayId > falls back to latest day point", async () => {
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
      fees24hUSD: "60.00",
    });
    await app.close();
  });
});



import { buildServer } from "./server";

describe("pools live routes", () => {
  it("GET /pools/:id with dayId > uses poolDayData(id) to compute APR", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "GET",
      url: "/pools/0xPOOL?dayId=0xpool-20240901",
    });
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
    const body = res.json();
    expect(body).toMatchObject({
      id: "0xpool",
      dayId: "0xpool-20240901",
      fees24hUSD: "50.00",
    });
    await app.close();
  });

  it("GET /pools/:id without dayId > falls back to latest day point", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/pools/0xPOOL" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      id: "0xpool",
      dayId: "0xpool-20240902",
      fees24hUSD: "60.00",
    });
    await app.close();
  });
});

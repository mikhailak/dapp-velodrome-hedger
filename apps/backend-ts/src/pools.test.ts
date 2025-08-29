// apps/backend-ts/src/pools.test.ts
import { describe, it, expect } from "vitest";
import { buildServer } from "./server";

describe("pools routes", () => {
  it("/pools/:id returns placeholder", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/pools/0xPOOL" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ id: "0xPOOL" });
    await app.close();
  });
});

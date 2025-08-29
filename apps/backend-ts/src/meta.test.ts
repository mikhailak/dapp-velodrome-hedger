// apps/backend-ts/src/meta.test.ts
import { describe, it, expect } from "vitest";
import { buildServer } from "./server";

describe("meta routes", () => {
  it("/version returns version", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/version" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("version");
    await app.close();
  });

  it("/config returns safe config", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/config" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("env");
    expect(body).toHaveProperty("port");
    expect(body).toHaveProperty("indexerUrl");
    await app.close();
  });
});

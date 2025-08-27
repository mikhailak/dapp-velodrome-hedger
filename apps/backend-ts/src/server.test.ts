import { describe, it, expect } from "vitest";
import { buildServer } from "./server";

describe("server", () => {
  it("healthz", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});

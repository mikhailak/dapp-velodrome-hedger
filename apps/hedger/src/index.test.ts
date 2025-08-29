import { describe, it, expect } from "vitest";
import { ping } from "./index";

describe("hedger ping", () => {
  it("returns ready", async () => {
    const res = await ping();
    expect(res).toEqual({ hedger: "ready" });
  });
});

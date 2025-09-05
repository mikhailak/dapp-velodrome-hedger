// apps/backend-ts/src/registry.e2e.test.ts
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { buildServer } from "./server";

type RegistryGetResponse = {
  key: string;
  keyHash: `0x${string}`;
  value: string;
};

type RegistryPostDryRun = {
  dryRun: true;
  key: string;
  value: number;
  wouldCall: {
    functionName: string;
    args: [`0x${string}`, string | number | bigint];
  };
};

type RegistryPostReal = {
  tx: `0x${string}`;
  key: string;
  value: number;
};

type RegistryPostResponse = RegistryPostDryRun | RegistryPostReal;

// helper: random int for "real write" теста
function randInt(min = 1, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe("registry e2e", () => {
  const key = "target_leverage";
  let app: ReturnType<typeof buildServer>;

  beforeAll(async () => {
    // используем текущее .env (anvil/адрес/и т.д.)
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST dry-run + GET should keep old value (WRITE_DRY_RUN=true)", async () => {
    // зафиксируем текущий value
    const beforeRes = await app.inject({ method: "GET", url: `/registry/${key}` });
    expect(beforeRes.statusCode).toBe(200);
    const before = beforeRes.json() as RegistryGetResponse;
    const oldValue = before.value;

    // имитируем запись
    const postRes = await app.inject({
      method: "POST",
      url: `/registry/${key}`,
      payload: { value: 123 },
      headers: { "content-type": "application/json" },
    });

    expect(postRes.statusCode).toBe(200);
    const postBody = postRes.json() as RegistryPostResponse;

    // допускаем оба варианта, но если dry-run — проверяем форму
    if (String(process.env.WRITE_DRY_RUN ?? "").toLowerCase() === "true") {
      // type guard на dry-run
      const isDryRun =
        typeof (postBody as RegistryPostDryRun).dryRun === "boolean" &&
        (postBody as RegistryPostDryRun).dryRun === true;

      expect(isDryRun).toBe(true);

      const dry = postBody as RegistryPostDryRun;
      expect(dry.key).toBe(key);
      expect(dry.value).toBe(123);
      expect(dry.wouldCall.functionName).toBe("setParam");
      expect(Array.isArray(dry.wouldCall.args)).toBe(true);
    }

    // GET не должен измениться в dry-run режиме
    const afterRes = await app.inject({ method: "GET", url: `/registry/${key}` });
    expect(afterRes.statusCode).toBe(200);
    const after = afterRes.json() as RegistryGetResponse;

    if (String(process.env.WRITE_DRY_RUN ?? "").toLowerCase() === "true") {
      expect(after.value).toBe(oldValue);
    }
  });

  it("POST real write + GET should reflect new value (requires E2E_WRITE_REAL=true)", async () => {
    // Чтобы не ронять CI, включаем только когда явно установлено
    if (String(process.env.E2E_WRITE_REAL ?? "").toLowerCase() !== "true") {
      // пометим как пропущенный
      return expect(true).toBe(true);
    }

    // тут предполагается:
    // 1) anvil запущен
    // 2) Registry задеплоен и REGISTRY_ADDRESS задан
    // 3) WRITE_DRY_RUN=false
    const newValue = randInt();

    const postRes = await app.inject({
      method: "POST",
      url: `/registry/${key}`,
      payload: { value: newValue },
      headers: { "content-type": "application/json" },
    });
    expect(postRes.statusCode).toBe(200);

    const body = postRes.json() as RegistryPostResponse;

    // ожидаем реальную запись
    expect(String(process.env.WRITE_DRY_RUN ?? "").toLowerCase()).toBe("false");
    // type guard на real
    const isReal = typeof (body as RegistryPostReal).tx === "string";
    expect(isReal).toBe(true);

    const real = body as RegistryPostReal;
    expect(real.key).toBe(key);
    expect(real.value).toBe(newValue);
    expect(real.tx).toMatch(/^0x[0-9a-fA-F]{64}$/);

    // читаем
    const getRes = await app.inject({ method: "GET", url: `/registry/${key}` });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as RegistryGetResponse;
    expect(Number(getBody.value)).toBe(newValue);
  });
});

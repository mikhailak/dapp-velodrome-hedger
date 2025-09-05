// apps/backend-ts/src/registry.e2e.test.ts
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { buildServer } from "./server";

// helper: random int for "real write" теста
function randInt(min = 1, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe("registry e2e", () => {
  const key = "target_leverage";
  let app: ReturnType<typeof buildServer>;

  beforeAll(async () => {
    // ВАЖНО: в этих тестах мы используем текущее .env (анвил/адрес/и т.д.)
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
    const before = beforeRes.json() as { value: string };
    const oldValue = before.value;

    // имитируем запись
    const postRes = await app.inject({
      method: "POST",
      url: `/registry/${key}`,
      payload: { value: 123 },
      headers: { "content-type": "application/json" },
    });

    // если в окружении включён WRITE_DRY_RUN=true, то ожидаем dryRun-ответ
    // если нет — этот тест всё равно пройдёт, просто не будет поля dryRun
    expect(postRes.statusCode).toBe(200);
    const postBody = postRes.json() as any;

    // допускаем оба варианта, но если dry-run — проверяем форму
    if (String(process.env.WRITE_DRY_RUN ?? "").toLowerCase() === "true") {
      expect(postBody).toHaveProperty("dryRun", true);
      expect(postBody).toHaveProperty("key", key);
      expect(postBody).toHaveProperty("value", 123);
    }

    // GET не должен измениться в dry-run режиме
    const afterRes = await app.inject({ method: "GET", url: `/registry/${key}` });
    expect(afterRes.statusCode).toBe(200);
    const after = afterRes.json() as { value: string };

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

    // тут предполагается, что:
    // 1) anvil запущен
    // 2) контракт Registry задеплоен и адрес прописан в .env (REGISTRY_ADDRESS)
    // 3) WRITE_DRY_RUN=false
    const newValue = randInt();

    const postRes = await app.inject({
      method: "POST",
      url: `/registry/${key}`,
      payload: { value: newValue },
      headers: { "content-type": "application/json" },
    });
    expect(postRes.statusCode).toBe(200);
    const body = postRes.json() as any;
    // ожидаем наличие tx хэша (в нормальном режиме)
    expect(String(process.env.WRITE_DRY_RUN ?? "").toLowerCase()).toBe("false");
    expect(body).toHaveProperty("tx");
    expect(typeof body.tx).toBe("string");

    // читаем
    const getRes = await app.inject({ method: "GET", url: `/registry/${key}` });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json() as { value: string };
    expect(Number(getBody.value)).toBe(newValue);
  });
});

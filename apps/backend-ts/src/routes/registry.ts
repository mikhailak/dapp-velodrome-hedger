// apps/backend-ts/src/routes/registry.ts
import { FastifyInstance } from "fastify";
import { publicClient, walletClient, registry } from "../chain";
import { keccak256, stringToHex } from "viem";

const MAX_VALUE = 1_000_000; // верхняя граница по заданию

export async function registerRegistryRoutes(app: FastifyInstance) {
  // GET /registry/:key  (read)
  app.get("/registry/:key", async (req, reply) => {
    // 🔹 нормализация ключа
    const rawKey = ((req.params as { key?: string })?.key ?? "");
    const key = rawKey.toLowerCase().trim();

    // 🔹 валидация ключа
    if (!key) {
      return reply.code(400).send({
        error: "bad_request",
        message: "key is empty",
      });
    }

    const keyHash = keccak256(stringToHex(key));

    // чтение из контракта
    const value = await publicClient.readContract({
      address: registry.address,
      abi: registry.abi,
      functionName: "u256",
      args: [keyHash],
    });

    return reply.send({ key, keyHash, value: value.toString() });
  });

  // POST /registry/:key { value: number }  (write)
  app.post("/registry/:key", async (req, reply) => {
    if (!walletClient) {
      return reply.code(500).send({ error: "internal_error", message: "wallet_not_configured" });
    }

    // 🔹 нормализация ключа
    const rawKey = ((req.params as { key?: string })?.key ?? "");
    const key = rawKey.toLowerCase().trim();

    // 🔹 валидация ключа
    if (!key) {
      return reply.code(400).send({
        error: "bad_request",
        message: "key is empty",
      });
    }

    // ожидаем { value: number } в теле
    const { value } = (req.body as { value?: unknown }) ?? {};

    // 🔹 валидация value
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return reply.code(400).send({
        error: "bad_request",
        message: "value must be a finite number",
      });
    }
    if (value < 0 || value > MAX_VALUE) {
      return reply.code(400).send({
        error: "bad_request",
        message: `value must be in range [0, ${MAX_VALUE}]`,
      });
    }
    // (опционально) если хотим только целые:
    if (!Number.isInteger(value)) {
      return reply.code(400).send({
        error: "bad_request",
        message: "value must be an integer",
      });
    }

    const keyHash = keccak256(stringToHex(key));
    const dryRun = String(process.env.WRITE_DRY_RUN ?? "").toLowerCase() === "true";

    if (dryRun) {
        return reply.send({
          dryRun: true,
          key,
          keyHash,
          value,
          note: "WRITE_DRY_RUN=true — транзакция не отправлена",
        });
      }
  
      if (!walletClient) {
        return reply.code(500).send({ error: "wallet_not_configured" });
      }

    // запись в контракт
    const hash = await walletClient.writeContract({
      address: registry.address,
      abi: registry.abi,
      functionName: "setParam",
      args: [keyHash, BigInt(value)],
    });

    return reply.send({ tx: hash, key, value });
  });
}

// apps/backend-ts/src/config.ts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  INDEXER_URL: z.string().url().optional(), // можно пустым в dev
  GRAPH_API_KEY: z.string().optional(),     // секрет, наружу не отдаём
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadConfig(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Собираем читаемую ошибку для логов/краша старта
    const flat = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${flat}`);
  }
  cached = parsed.data;
  return cached;
}

// Безопасная версия для выдачи наружу (не включаем секреты)
export function publicConfig() {
  const { NODE_ENV, PORT, INDEXER_URL } = loadConfig();
  return { env: NODE_ENV, port: PORT, indexerUrl: INDEXER_URL ?? null };
}

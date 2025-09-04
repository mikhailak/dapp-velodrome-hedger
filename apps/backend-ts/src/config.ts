// apps/backend-ts/src/config.ts
import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv"; 
import { z } from "zod";

// 1) Явно загрузим .env (ищем сначала в apps/backend-ts/.env, затем в корне репо)
(() => {
  const candidates = [
    path.resolve(__dirname, "..", ".env"),      // apps/backend-ts/.env
    path.resolve(__dirname, "..", "..", ".env") // <repo-root>/.env
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
})();

// 2) Схема окружения
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),

  // внешний индексер (если используем)
  INDEXER_URL: z.string().url().optional(),

  // доступ к The Graph
  GRAPH_API_KEY: z.string().optional(),
  GRAPH_SUBGRAPH_ID: z.string().optional(),
});

let cached: z.infer<typeof EnvSchema> | null = null;

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): AppConfig {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid environment: ${flat}`);
  }
  cached = parsed.data;
  return cached;
}

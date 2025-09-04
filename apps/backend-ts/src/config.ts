// apps/backend-ts/src/config.ts
import * as dotenv from "dotenv";
import { z } from "zod";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// __dirname-замена для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// грузим .env (локальный пакета) и корневой .env (если есть)
dotenv.config({ path: resolve(__dirname, "..", ".env") });       // apps/backend-ts/.env
dotenv.config({ path: resolve(__dirname, "..", "..", ".env") }); // repo/.env

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),

  INDEXER_URL: z.string().url().optional(),

  GRAPH_API_KEY: z.string().optional(),
  GRAPH_SUBGRAPH_ID: z.string().optional(),
});

let cached: z.infer<typeof EnvSchema> | null = null;
export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): AppConfig {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid environment: ${flat}`);
  }
  cached = parsed.data;
  return cached;
}

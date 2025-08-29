// apps/backend-ts/src/routes/meta.ts
import { FastifyInstance } from "fastify";
import { publicConfig } from "../config";

const VERSION = process.env.APP_VERSION ?? "0.1.0";

export async function registerMetaRoutes(app: FastifyInstance) {
  app.get("/version", async () => ({ version: VERSION }));
  app.get("/config", async () => publicConfig());
}

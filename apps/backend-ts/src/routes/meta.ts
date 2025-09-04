import { FastifyPluginCallback } from "fastify";
import { loadConfig } from "../config";

const metaPlugin: FastifyPluginCallback = (app, _opts, done) => {
  // /healthz
  app.get("/healthz", async (_req, reply) => {
    reply.send({ ok: true });
  });

  // /version — берём из env (витест/нода проставляет npm_package_version), иначе "0.0.0"
  app.get("/version", async (_req, reply) => {
    const version = process.env.npm_package_version ?? "0.0.0";
    reply.send({ version });
  });

  // /config — безопасный вывод конфигурации
  app.get("/config", async (_req, reply) => {
    const cfg = loadConfig();
    reply.send({
      env: cfg.NODE_ENV,
      port: cfg.PORT,
      indexerUrl: cfg.INDEXER_URL ?? null,
      graphApiKey: cfg.GRAPH_API_KEY ?? null,
      graphSubgraphId: cfg.GRAPH_SUBGRAPH_ID ?? null,
    });
  });

  done();
};

export default metaPlugin;

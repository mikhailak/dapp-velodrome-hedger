// apps/backend-ts/src/server.ts
import Fastify, { type FastifyError, type FastifyRequest, type FastifyReply } from "fastify";
import { loadConfig } from "./config";
import { getLoggerOptions } from "./logger";
import { registerMetaRoutes } from "./routes/meta";
import { registerPoolRoutes } from "./routes/pools";

export function buildServer() {
  const app = Fastify({
    logger: getLoggerOptions(),
    disableRequestLogging: true,
  });

  app.addHook("onResponse", (req, reply, done) => {
    const { method, url } = req;
    const status = reply.statusCode;
    app.log.info({ method, url, status }, "http");
    done();
  });

  app.get("/healthz", async () => ({ ok: true }));

  app.register(registerMetaRoutes);
  app.register(registerPoolRoutes);

  app.setErrorHandler((err: FastifyError & { statusCode?: number }, _req: FastifyRequest, reply: FastifyReply) => {
    app.log.error({ err }, "unhandled");
    const status = err.statusCode ?? 500;
    reply.code(status).send({
      error: status === 500 ? "internal_error" : "bad_request",
      message: status === 500 ? "Internal Server Error" : err.message,
    });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const app = buildServer();
  app
    .listen({ port: cfg.PORT, host: "0.0.0.0" })
    .then(() => app.log.info(`listening on :${cfg.PORT}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

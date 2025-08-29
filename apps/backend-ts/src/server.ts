import Fastify from "fastify";
import { loadConfig } from "./config";
import { getLoggerOptions } from "./logger";
import { registerMetaRoutes } from "./routes/meta";
import { registerPoolRoutes } from "./routes/pools";

export function buildServer() {
  const app = Fastify({
    logger: getLoggerOptions(),   // <-- теперь конфиг-объект
    disableRequestLogging: true,
  });

  // Простое http-логирование (без getResponseTime в v5)
  app.addHook("onResponse", (req, reply, done) => {
    const { method, url } = req;
    const status = reply.statusCode;
    app.log.info({ method, url, status }, "http");
    done();
  });

  app.get("/healthz", async () => ({ ok: true }));

  app.register(registerMetaRoutes);
  app.register(registerPoolRoutes);

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, "unhandled");
    const status = (err as any).statusCode ?? 500;
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
      // тут можно просто console.error, чтобы не тащить pino-инстанс
      console.error(e);
      process.exit(1);
    });
}

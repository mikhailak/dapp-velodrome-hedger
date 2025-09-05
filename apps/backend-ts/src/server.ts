import Fastify, { FastifyError } from "fastify";
import { getLoggerOptions } from "./logger";
import metaRoutes from "./routes/meta";
import poolRoutes from "./routes/pools";
import poolDaysRoutes from "./routes/pools.days";
import { registerRegistryRoutes } from "./routes/registry";


export function buildServer() {
  const app = Fastify({
    logger: getLoggerOptions(),
    disableRequestLogging: true,
  });

  // Компактный http-лог
  app.addHook("onResponse", (req, reply, done) => {
    const { method, url } = req;
    const status = reply.statusCode;
    app.log.info({ method, url, status }, "http");
    done();
  });

  // Регистрация роутов (ВАЖНО: default-экспорт функций-плагинов)
  app.register(metaRoutes);
  app.register(poolRoutes);
  app.register(poolDaysRoutes);
  app.register(registerRegistryRoutes);

  app.ready().then(() => {
    app.log.info(app.printRoutes());
  });
  

  // Единый обработчик ошибок
  app.setErrorHandler((err: FastifyError & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode ?? 500;
    app.log.error({ err }, "unhandled");
    reply.code(status).send({
      error: status === 400 ? "bad_request" : "internal_error",
      message: err.message,
    });
  });

  return app;
}

// Режим standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  app.listen({ host: "0.0.0.0", port })
    .then(() => app.log.info(`listening on :${port}`))
    .catch((e) => {
      app.log.error(e);
      process.exit(1);
    });
}


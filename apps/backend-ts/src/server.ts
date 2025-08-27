import Fastify from "fastify";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/healthz", async () => ({ ok: true }));

  // Заглушка: дальше здесь появятся /pools и др.
  app.get("/", async () => ({ service: "backend-ts", status: "ready" }));

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  const port = Number(process.env.PORT || 3000);
  app.listen({ port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

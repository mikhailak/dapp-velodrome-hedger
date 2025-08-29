// apps/backend-ts/src/routes/pools.ts
import { FastifyInstance } from "fastify";

export async function registerPoolRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string }
  }>("/pools/:id", async (req, reply) => {
    const { id } = req.params;
    // Пока заглушка — позже заменим вызовом indexer’а
    return reply.send({
      id,
      metrics: null,
      note: "metrics will be fetched from indexer in Lesson 3",
    });
  });
}

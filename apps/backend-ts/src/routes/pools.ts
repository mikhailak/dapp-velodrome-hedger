import { FastifyInstance } from "fastify";
import { fetchPoolById } from "../services/pools";

export async function registerPoolRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/pools/:id", async (req, reply) => {
    const pool = await fetchPoolById(req.params.id);
    if (!pool) return reply.code(404).send({ error: "not_found", message: "Pool not found" });

    // Можно отдать как есть или чуть нормализовать «под клиента»
    return {
      id: pool.id,
      tvlUSD: pool.totalValueLockedUSD ?? null,
      volumeUSD: pool.volumeUSD ?? null,
      feesUSD: pool.feesUSD ?? null,
      tvlToken0: pool.totalValueLockedToken0 ?? null,
      tvlToken1: pool.totalValueLockedToken1 ?? null,
      feeTier: pool.feeTier ?? null,
      token0: pool.token0 ?? null,
      token1: pool.token1 ?? null,
    };
  });
}

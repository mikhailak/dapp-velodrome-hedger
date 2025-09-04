import { FastifyPluginCallback } from "fastify";
import { fetchPoolDays } from "../services/pools";

type Params = { id: string };
type Query = { last?: string };

const poolDaysPlugin: FastifyPluginCallback = (app, _opts, done) => {
  // GET /pools/:id/days?last=2
  app.get<{ Params: Params; Querystring: Query }>(
    "/pools/:id/days",
    async (req, reply) => {
      const id = req.params.id.toLowerCase();
      const last = Number(req.query.last ?? 2);
      const points = await fetchPoolDays(id, Number.isFinite(last) && last > 0 ? last : 2);
      reply.send(points);
    }
  );

  done();
};

export default poolDaysPlugin;

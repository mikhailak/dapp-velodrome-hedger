import { FastifyPluginCallback } from "fastify";
import {
  fetchPoolById,
  fetchPoolDayById,
  fetchPoolDayLast,
} from "../services/pools";

type GetPoolParams = { id: string };
type GetPoolQuery = { dayId?: string };
type GetPoolsQuery = { ids?: string; dayId?: string };

const poolsPlugin: FastifyPluginCallback = (app, _opts, done) => {
  // GET /pools/:id?dayId=...
  app.get<{ Params: GetPoolParams; Querystring: GetPoolQuery }>(
    "/pools/:id",
    async (req, reply) => {
      const id = req.params.id;
      const dayId = req.query.dayId;

      // если dayId не задан, попробуем подтянуть последний daypoint (для вычислений)
      let poolDay = null as Awaited<ReturnType<typeof fetchPoolDayById>> | null;
      if (dayId) {
        poolDay = await fetchPoolDayById(id.toLowerCase(), dayId);
      } else {
        poolDay = await fetchPoolDayLast(id.toLowerCase());
      }

      const normalized = await fetchPoolById(id, poolDay?.id ?? null);
      reply.send(normalized);
    }
  );

  // GET /pools?ids=0x...,0x...&dayId=...
  app.get<{ Querystring: GetPoolsQuery }>("/pools", async (req, reply) => {
    const idsCsv = req.query.ids ?? "";
    const ids = idsCsv
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      reply.code(400).send({
        error: "bad_request",
        message: "Provide ids=0x...,0x...",
      });
      return;
    }

    const results = await Promise.all(
      ids.map(async (id) => {
        // переиспользуем уже существующую бизнес-логику:
        const res = await app.inject({
          method: "GET",
          url: `/pools/${id}${
            req.query.dayId ? `?dayId=${encodeURIComponent(req.query.dayId)}` : ""
          }`,
        });
        if (res.statusCode !== 200) {
          return { id: id.toLowerCase(), error: `status_${res.statusCode}` };
        }
        return res.json();
      })
    );

    reply.send(results);
  });

  done();
};

export default poolsPlugin;

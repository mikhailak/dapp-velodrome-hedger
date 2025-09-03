// (роут с поддержкой ?dayId=, APR-метрики и кэшем)
// =======================================
import { FastifyInstance } from "fastify";
import {
  fetchPoolById,
  fetchPoolDayById,
  fetchPoolDayLast,
} from "../services/pools";
import { d, toFixedStr } from "../utils/num";
import { memo } from "../utils/cache";

type GetPoolParams = { id: string };
type GetPoolQuery = { dayId?: string };

export async function registerPoolRoutes(app: FastifyInstance) {
  app.get<{ Params: GetPoolParams; Querystring: GetPoolQuery }>(
    "/pools/:id",
    async (req, reply) => {
      if (!process.env.GRAPH_API_KEY && !process.env.GRAPH_ENDPOINT) {
        return reply
          .code(503)
          .send({ error: "unavailable", message: "Graph credentials are not configured" });
      }

      const id = req.params.id;

      // данные пула (кэш 20s)
      const pool = await memo(`pool:${id}`, 20_000, () => fetchPoolById(id));
      if (!pool) {
        return reply.code(404).send({ error: "not_found", message: "Pool not found" });
      }

      // выбираем «дневную точку»: по dayId, если задан — иначе «последний день»
      const dayPoint = await memo(
        req.query.dayId ? `poolDay:${req.query.dayId}` : `poolDayLast:${id}`,
        20_000,
        () =>
          req.query.dayId ? fetchPoolDayById(req.query.dayId!) : fetchPoolDayLast(id)
      );

      // базовые числа
      const tvlUSD = d(pool.totalValueLockedUSD);
      const volumeUSD = d(pool.volumeUSD);
      const feesUSD = d(pool.feesUSD);

      // day-метрики
      const fees24h = d(dayPoint?.feesUSD);
      const tvlDay = d(dayPoint?.tvlUSD).gt(0) ? d(dayPoint?.tvlUSD) : tvlUSD;

      const apr24h = tvlDay.gt(0) ? fees24h.div(tvlDay) : d(0);
      const aprYear = apr24h.mul(365);

      return {
        id: pool.id,
        tvlUSD: toFixedStr(tvlUSD, 6),
        volumeUSD: toFixedStr(volumeUSD, 2),
        feesUSD: toFixedStr(feesUSD, 2),

        tvlToken0: pool.totalValueLockedToken0 ?? null,
        tvlToken1: pool.totalValueLockedToken1 ?? null,
        feeTier: pool.feeTier ?? null,
        token0: pool.token0 ?? null,
        token1: pool.token1 ?? null,

        // day-данные (если есть)
        dayId: dayPoint?.id ?? null,
        dayDate: dayPoint?.date ?? null,
        fees24hUSD: toFixedStr(fees24h, 2),
        apr24h: toFixedStr(apr24h.mul(100), 2), // %
        aprYear: toFixedStr(aprYear.mul(100), 2), // %
      };
    }
  );
}
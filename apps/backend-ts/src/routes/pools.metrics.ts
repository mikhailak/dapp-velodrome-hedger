// apps/backend-ts/src/routes/pools.metrics.ts
import { FastifyInstance } from "fastify";
import { fetchPoolById, fetchPoolDayLast } from "../services/pools";
import { readMany } from "../services/registry";

/**
 * GET /pools/:id/metrics
 * Ответ: { pool: {...}, strategy: {...} }
 */
export default async function poolsMetricsRoutes(app: FastifyInstance) {
  app.get("/pools/:id/metrics", async (req, reply) => {
    const { id } = req.params as { id: string };

    // 1) найдём последний daypoint и подтянем пул (чтобы были fees24hUSD и apr24hPct)
    const last = await fetchPoolDayLast(id);
    const live = await fetchPoolById(id, last?.id ?? null);

    // 2) снимем стратегические параметры из реестра (все uint256)
    const keys = [
      "target_leverage",   // договоримся: bps (10000 = 1.0x, 15000 = 1.5x)
      "max_slippage_bps",  // bps
      "hedge_enabled",     // 0/1
      "pool_id",           // временно как u256 (см. примечание ниже)
    ];
    const reg = await readMany(keys);

    // 3) склеим ответ
    return reply.send({
      pool: {
        id: live.id,
        dayId: live.dayId,                 // например "0xpool-YYYYMMDD" | null
        feeTier: live.feeTier,
        token0: live.token0,
        token1: live.token1,
        tvlUSD: live.tvlUSD,
        volumeUSD: live.volumeUSD,
        feesUSD: live.feesUSD,
        fees24hUSD: live.fees24hUSD,
        apr24hPct: live.apr24hPct,         // строка, как в нормализации
      },
      strategy: {
        targetLeverageBps: Number(reg["target_leverage"] ?? 0n),
        maxSlippageBps: Number(reg["max_slippage_bps"] ?? 0n),
        hedgeEnabled: Number(reg["hedge_enabled"] ?? 0n) === 1 ? 1 : 0,
        poolIdU256: reg["pool_id"]?.toString() ?? "0",
      },
    });
  });
}

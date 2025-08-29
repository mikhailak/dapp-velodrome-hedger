import { loadConfig } from "./config";

/**
 * Возвращаем чистый объект опций для Fastify v5.
 * Никаких pino() тут не создаём, Fastify сам создаст logger по этим настройкам.
 */
export function getLoggerOptions() {
  const env = loadConfig().NODE_ENV;
  const level = process.env.LOG_LEVEL ?? (env === "production" ? "info" : "debug");

  // В проде — обычный JSON-лог; в dev/test — человекочитаемый pretty-транспорт
  const transport =
    env === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard",
          },
        };

  return { level, transport };
}

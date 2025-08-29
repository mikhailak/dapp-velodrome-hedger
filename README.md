Понял 👍 Дам одним цельным блоком, чтобы просто скопировать и вставить как есть в WSL.


# dapp-velodrome-hedger

Monorepo для экспериментов с dApp на Node.js/TypeScript + Rust + Solidity.  
В рамках учебного проекта: получение данных о пулах ликвидности (Velodrome) и хеджирование на Hyperliquid.

## 📦 Структура проекта

```

.
├── apps/
│   ├── backend-ts/    # backend-сервис (Fastify), REST API + health-check
│   └── hedger/        # сервис-хеджер (TS)
├── infra/             # Dockerfile’ы, docker-compose
├── indexers/          # Rust-утилиты/сервисы для индексации (будет добавлено)
├── pnpm-workspace.yaml
└── .github/workflows/ # CI (lint, test, docker build)

````

## 🚀 Локальный запуск (WSL2/Ubuntu)

1. Установить [pnpm](https://pnpm.io/) (через corepack):
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
````

2. Установить зависимости:

   ```bash
   pnpm -r install
   ```

3. Запустить backend локально:

   ```bash
   cd apps/backend-ts
   pnpm dev
   curl localhost:3000/healthz
   ```

4. Запустить через Docker Compose:

   ```bash
   cd infra
   docker compose up -d
   curl localhost:3000/healthz
   ```

## 🧪 Тесты

В каждом пакете есть минимальные smoke-тесты (Vitest).

```bash
pnpm -r test
```

* backend-ts: проверяет эндпоинт `/healthz`
* hedger: проверяет функцию `ping()`

## 🔍 Линтинг и форматирование

```bash
pnpm -r lint
```

Конфиг: ESLint v9 (flat config) + Prettier.

## 🔄 CI

GitHub Actions выполняет:

* install deps + cache
* lint (`pnpm -r lint`)
* unit tests (backend + hedger)
* build docker images (без публикации)

## 🔑 Переменные окружения

* `GRAPH_API_KEY` — доступ к The Graph (Velodrome subgraph)
* `INDEXER_URL` — url сервиса индексатора
* `HYPERLIQUID_ACCOUNT`, `HYPERLIQUID_AGENT_PRIVKEY` — (будет нужно для интеграции с Hyperliquid)

Пример: см. `.env.example`.




---

## 📜 Лицензия

MIT




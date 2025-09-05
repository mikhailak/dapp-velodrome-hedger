# ===== Настройки =====
BACKEND_DIR=apps/backend-ts

# ===== Команды =====

# Запуск локальной ноды Anvil
anvil:
	cd contracts && anvil --port 8545

# Запуск backend в режиме разработки
dev:
	cd $(BACKEND_DIR) && pnpm dev

# Сборка backend (ts -> js)
build:
	cd $(BACKEND_DIR) && pnpm build

# Запуск backend в "проде"
start:
	cd $(BACKEND_DIR) && pnpm start

# Перезапуск backend (dev mode)
restart:
	@echo "🔄 Останавливаю старый backend (порт 3000)..."
	@pkill -f "tsx src/server.ts" || true
	@echo "🚀 Запускаю новый backend..."
	cd $(BACKEND_DIR) && pnpm dev

# Docker: пересобрать и поднять все сервисы
docker-up:
	docker compose up --build -d

# Docker: остановить
docker-down:
	docker compose down

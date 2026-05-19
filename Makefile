## Root Makefile for AdMidnight monorepo — helper targets for install/build/dev/test
# Provides install/build/dev/test/lint and demo helpers

SHELL := /bin/bash
DOCKER_COMPOSE := docker-compose
ENV_LOADER := set -a; source ./.env; if [ -f ./.env.local ]; then source ./.env.local; fi; set +a;

.PHONY: install build dev test lint docker-up docker-down demo flutter-run seed e2e ensure-env migrate deploy-contracts

ensure-env:
	@if [ ! -f .env ]; then \
	  cp .env.example .env; \
	  echo "Created .env from .env.example"; \
	fi

	@if [ ! -f .env.local ]; then \
	  touch .env.local; \
	  echo "Created empty .env.local"; \
	fi

install:
	pnpm install

build:
	# Build order: zk-circuits -> api -> dashboard -> mobile
	pnpm -w -r --filter "./packages/zk-circuits" run build || true
	pnpm -w -r --filter "@admidnight/api" run build
	pnpm -w -r --filter "@admidnight/advertiser-dashboard" run build

dev:
	# Start API and Dashboard in parallel
	pnpm -w -r --filter "@admidnight/api" --filter "@admidnight/advertiser-dashboard" run dev --parallel
	@echo "To run mobile app, use 'make flutter-run' from repo root or see apps/mobile/README.md"

test:
	# Runs tests across workspaces
	pnpm -w -r --filter "@admidnight/api" run test || true
	pnpm -w -r --filter "@admidnight/advertiser-dashboard" run test || true
	@echo "Run Flutter tests in apps/mobile/test with 'make flutter-run' or open the folder"

lint:
	pnpm -w -r --filter "@admidnight/api" run lint || true
	pnpm -w -r --filter "@admidnight/advertiser-dashboard" run lint || true
	@echo "Run 'dart analyze' in apps/mobile for mobile linting"

docker-up:
	$(MAKE) ensure-env
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 $(DOCKER_COMPOSE) up -d

docker-down:
	$(DOCKER_COMPOSE) down

migrate: ensure-env
	@$(ENV_LOADER) pnpm --filter @admidnight/api exec -- prisma migrate deploy


demo: ensure-env
	@set -euo pipefail; \
	$(ENV_LOADER) \
	INDEXER_NETWORK_ID=undeployed; export INDEXER_NETWORK_ID; \
	if [[ -z "${INDEXER_SECRET:-}" || "${INDEXER_SECRET}" =~ ^[0-9]+$$ ]]; then \
		INDEXER_SECRET=$$(openssl rand -hex 32); \
		export INDEXER_SECRET; \
	fi; \
	$(DOCKER_COMPOSE) up -d postgres midnight-node proof-server indexer; \
	echo "Waiting for services to become healthy..."; \
	bash ./scripts/wait-for-it.sh localhost:5432 --timeout=60 -- echo "✓ Postgres ready"; \
	bash ./scripts/wait-for-it.sh localhost:9944 --timeout=120 -- echo "✓ Midnight node ready"; \
	bash ./scripts/wait-for-http.sh http://localhost:6300/health --timeout=60; \
	echo "✓ Proof server ready"; \
	bash ./scripts/wait-for-http.sh http://localhost:8088/api/v4/graphql --timeout=60 --post-graphql; \
	echo "✓ Indexer ready"; \
	pnpm --filter @admidnight/api exec -- prisma migrate deploy; \
	pnpm --filter @admidnight/api exec -- prisma db seed; \
	$(MAKE) deploy-contracts; \
	echo "Starting API and dashboard containers..."; \
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 $(DOCKER_COMPOSE) up -d api dashboard; \
	bash ./scripts/wait-for-http.sh http://localhost:3001/api/v1/health --timeout=120; \
	echo "✓ API ready at http://localhost:3001/api/v1"; \
	bash ./scripts/wait-for-http.sh http://localhost:3000 --timeout=120; \
	echo "✓ Dashboard ready at http://localhost:3000"; \
	echo ""; \
	echo "=== AdMidnight demo ready ==="; \
	echo "  Dashboard: http://localhost:3000"; \
	echo "  API:       http://localhost:3001/api/v1"; \
	echo "  Login:     $${ADVERTISER_LOGIN_EMAIL} / $${ADVERTISER_LOGIN_PASSWORD}"; \
	echo ""

flutter-run:
	@echo "Run flutter from apps/mobile with .env provided."
	@if [ -f .env ]; then \
	  set -a; source .env; set +a; \
	  (cd apps/mobile && flutter run --dart-define=API_URL=$NEXT_PUBLIC_API_URL); \
	else \
	  echo ".env not found at repo root. Copy .env.example to .env and set variables."; exit 1; \
	fi

seed:
	@echo "Running seed script inside admidnight-api"
	docker --context default exec -e NODE_PATH=/app/apps/api/node_modules admidnight-api node /app/scripts/seed.container.js

e2e:
	@echo "Run e2e demo script"
	node scripts/e2e-demo.js

deploy-contracts: ensure-env
	@echo "Deploying contracts via packages/zk-circuits"
	@$(ENV_LOADER) pnpm --filter @admidnight/zk-circuits run deploy

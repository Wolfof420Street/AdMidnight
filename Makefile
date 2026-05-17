## Root Makefile for AdMidnight monorepo — helper targets for install/build/dev/test
# Provides install/build/dev/test/lint and demo helpers

SHELL := /bin/bash
DOCKER_CONFIG_DIR := $(CURDIR)/.docker-nocreds
DOCKER_COMPOSE := DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker --context default compose

.PHONY: install build dev test lint docker-up docker-down demo flutter-run seed e2e

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
	$(DOCKER_COMPOSE) up -d

docker-down:
	$(DOCKER_COMPOSE) down

demo: docker-up
	@echo "Waiting for services to become healthy..."
	bash ./scripts/wait-for-it.sh localhost:5432 --timeout=60 -- echo "✓ Postgres ready"
	bash ./scripts/wait-for-it.sh localhost:9944 --timeout=120 -- echo "✓ Midnight node ready"
	bash ./scripts/wait-for-it.sh localhost:6300 --timeout=60 -- echo "✓ Proof server ready"
	bash ./scripts/wait-for-it.sh localhost:8088 --timeout=60 -- echo "✓ Indexer ready"
	@echo "Waiting for API to be ready..."
	bash ./scripts/wait-for-it.sh localhost:3001 --timeout=60 -- echo "✓ API ready at http://localhost:3001/api/v1"
	@echo "Waiting for Dashboard to be ready..."
	bash ./scripts/wait-for-it.sh localhost:3000 --timeout=60 -- echo "✓ Dashboard ready at http://localhost:3000"
	@echo ""
	@echo "🎉 AdMidnight demo environment ready!"
	@echo "  Dashboard: http://localhost:3000"
	@echo "  API:       http://localhost:3001/api/v1"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open http://localhost:3000 in your browser"
	@echo "  2. Login with demo@admidnight.io"
	@echo "  3. Run 'make seed' to create demo data"
	@echo "  4. Run 'make e2e' to test the full flow"

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

deploy-contracts:
	@echo "Deploying contracts via packages/zk-circuits/scripts/deploy-run.js"
	node packages/zk-circuits/scripts/deploy-run.js

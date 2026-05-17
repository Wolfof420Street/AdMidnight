## Makefile for Flutter mobile workspace
# Provides a flutter-run helper that pulls variables from repo root .env

.PHONY: flutter-run

flutter-run:
	@if [ -f ../../.env ]; then \
	  set -a; source ../../.env; set +a; \
	  flutter run --dart-define=API_URL=$NEXT_PUBLIC_API_URL --dart-define=MIDNIGHT_NODE_URL=$MIDNIGHT_NODE_URL; \
	else \
	  echo "Create a .env file at repo root from .env.example"; exit 1; \
	fi

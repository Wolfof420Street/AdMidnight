## Makefile for zk-circuits — compile contracts to managed artifacts
# Per Midnight docs, compile command: compact compile <file.compact> managed/<contract>/

.PHONY: compile clean

compile: clean
	@echo "Compiling Compact contracts..."
	@if ! command -v compact >/dev/null 2>&1; then \
	  echo "Error: compact compiler not found."; \
	  echo "Install from: https://docs.midnight.network/getting-started/installation"; \
	  exit 1; \
	fi
	@mkdir -p managed
	@echo "  AdMatchRegistry.compact"
	@compact compile src/AdMatchRegistry.compact managed/AdMatchRegistry/ || exit 1
	@echo "  AdAuction.compact"
	@compact compile src/AdAuction.compact managed/AdAuction/ || exit 1
	@echo "  UserReward.compact"
	@compact compile src/UserReward.compact managed/UserReward/ || exit 1
	@echo "Compilation complete. Artifacts in managed/"

clean:
	@rm -rf managed/


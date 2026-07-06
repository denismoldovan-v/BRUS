#!/usr/bin/env bash
# AI Security Demo — stop stacks and optionally remove volumes

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

MOCK_COMPOSE="docker-compose.mock.yml"
REMOVED=()

echo "==> AI Security Demo cleanup"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  if docker compose -f "$MOCK_COMPOSE" ps -q 2>/dev/null | grep -q .; then
    echo "==> Stopping Demo Mode stack..."
    docker compose -f "$MOCK_COMPOSE" down
    REMOVED+=("Demo Mode containers (docker-compose.mock.yml)")
  fi

  if docker compose ps -q 2>/dev/null | grep -q .; then
    echo "==> Stopping Full Ollama stack..."
    docker compose down
    REMOVED+=("Full Ollama stack containers (docker-compose.yml)")
  fi
else
  echo "Docker Compose not available; skipping container shutdown."
fi

echo ""
read -r -p "Delete Docker volumes (database and Ollama model cache)? [y/N] " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f "$MOCK_COMPOSE" down -v 2>/dev/null || true
    docker compose down -v 2>/dev/null || true
    REMOVED+=("Docker volumes for mock and full stacks")
  fi
else
  echo "Volumes kept."
fi

echo ""
if [[ ${#REMOVED[@]} -eq 0 ]]; then
  echo "Nothing was running. No containers were removed."
else
  echo "Cleanup summary:"
  for item in "${REMOVED[@]}"; do
    echo "  - ${item}"
  done
fi

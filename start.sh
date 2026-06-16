#!/usr/bin/env bash
# AI Security Demo — one-command startup (Linux / macOS / Git Bash)
#
# Usage:
#   ./start.sh           # Docker + Ollama + PostgreSQL (recommended)
#   ./start.sh --mock    # Docker without Ollama (mock AI, no GPU)
#   ./start.sh --local   # No Docker — local Node + Ollama on host

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

MODE="docker"
COMPOSE_FILE="docker-compose.yml"

for arg in "$@"; do
  case "$arg" in
    --mock)  MODE="mock"; COMPOSE_FILE="docker-compose.mock.yml" ;;
    --local) MODE="local" ;;
    --help)
      echo "Usage: ./start.sh [--mock | --local]"
      echo "  (default)  Docker full stack: PostgreSQL + Ollama + app"
      echo "  --mock     Docker without Ollama (USE_MOCK_AI=1)"
      echo "  --local    Run on host (requires Node, pnpm, PostgreSQL, Ollama)"
      exit 0
      ;;
  esac
done

if [[ "$MODE" == "local" ]]; then
  echo "==> Local mode"
  cd front

  if [[ ! -f .env.local ]]; then
    echo "==> Creating .env.local from .env.example"
    cp .env.example .env.local
    SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
    if grep -q "^AUTH_SECRET=" .env.local; then
      sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=$SECRET|" .env.local && rm -f .env.local.bak
    fi
    echo "    Edit front/.env.local — set POSTGRES_URL before continuing."
    echo "    Example: POSTGRES_URL=postgresql://brus:brus@localhost:5432/brus"
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    echo "Installing pnpm..."
    npm install -g pnpm
  fi

  echo "==> Installing dependencies..."
  pnpm install

  echo "==> Running database migrations..."
  pnpm db:migrate

  echo "==> Starting dev server at http://localhost:3000"
  pnpm dev
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker not found. Install Docker Desktop or use: ./start.sh --local"
  exit 1
fi

echo "==> Docker mode ($COMPOSE_FILE)"
echo "    App:       http://localhost:3000"
echo "    Ollama:    http://localhost:11434 (full stack only)"
echo "    PostgreSQL localhost:5432  user/brus/db/brus"
echo ""
echo "    First run pulls llama3.2 — may take several minutes."
echo ""

docker compose -f "$COMPOSE_FILE" up --build

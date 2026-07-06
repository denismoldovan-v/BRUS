#!/usr/bin/env bash
# AI Security Demo — instructor setup (Demo Mode, no Ollama)

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

MOCK_COMPOSE="docker-compose.mock.yml"

echo "==> AI Security Demo: Demo Mode setup"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed."
  echo "Install Docker Engine: https://docs.docker.com/engine/install/"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose v2 is not available."
  echo "Install the Docker Compose plugin for your Docker installation."
  exit 1
fi

if [[ -f .gitmodules ]]; then
  if [[ ! -d front ]] || [[ ! -f front/package.json ]] || [[ ! -f front/Dockerfile ]]; then
    echo "==> Initializing front/ submodule..."
    git submodule update --init --recursive
  fi
fi

if [[ ! -d front ]] || [[ ! -f front/package.json ]] || [[ ! -f front/Dockerfile ]]; then
  echo "ERROR: front/ directory is missing or incomplete. Please clone the full repository."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "==> Creating .env from .env.docker"
  cp .env.docker .env
  SECRET="$(openssl rand -base64 32)"
  if grep -q '^AUTH_SECRET=' .env; then
    sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=${SECRET}|" .env
    rm -f .env.bak
  else
    echo "AUTH_SECRET=${SECRET}" >> .env
  fi
  if grep -q '^USE_MOCK_AI=' .env; then
    sed -i.bak 's|^USE_MOCK_AI=.*|USE_MOCK_AI=1|' .env
    rm -f .env.bak
  else
    echo "USE_MOCK_AI=1" >> .env
  fi
fi

echo "==> Starting Demo Mode stack (PostgreSQL + app, mock AI)..."
docker compose -f "$MOCK_COMPOSE" up --build -d

echo ""
echo "Demo Mode is running."
echo ""
echo "Application:"
echo "http://localhost:3000"
echo ""
echo "Logs:"
echo "docker compose -f ${MOCK_COMPOSE} logs -f app"
echo ""
echo "Stop:"
echo "docker compose -f ${MOCK_COMPOSE} down"

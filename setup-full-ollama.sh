#!/usr/bin/env bash
# AI Security Demo — full stack with Ollama and llama3.2

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> AI Security Demo: Full Ollama Mode setup"

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

if [[ ! -d front ]] || [[ ! -f front/package.json ]] || [[ -z "$(ls -A front 2>/dev/null)" ]]; then
  echo "==> Initializing front/ submodule..."
  git submodule update --init --recursive
fi

if [[ ! -f front/package.json ]]; then
  echo "ERROR: front/ is missing or empty. Clone the repository with submodules:"
  echo "  git clone --recurse-submodules <repo-url>"
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
    sed -i.bak 's|^USE_MOCK_AI=.*|USE_MOCK_AI=0|' .env
    rm -f .env.bak
  else
    echo "USE_MOCK_AI=0" >> .env
  fi
fi

echo ""
echo "WARNING: Full mode requires around 8GB RAM and downloads llama3.2."
echo "First startup may take several minutes."
echo ""

echo "==> Starting full stack (PostgreSQL + Ollama + app)..."
docker compose up --build -d

echo "==> Waiting for Ollama..."
ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T ollama ollama list >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" -ne 1 ]]; then
  echo "WARNING: Ollama did not become ready in time. Pull the model manually:"
  echo "  docker compose exec ollama ollama pull llama3.2"
else
  echo "==> Pulling llama3.2 (skip if already present)..."
  docker compose exec -T ollama ollama pull llama3.2
fi

echo ""
echo "Full Ollama Mode is running."
echo ""
echo "Application:"
echo "http://localhost:3000"
echo ""
echo "Logs:"
echo "docker compose logs -f app"
echo ""
echo "Stop:"
echo "docker compose down"

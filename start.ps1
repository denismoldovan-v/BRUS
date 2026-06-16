# AI Security Demo — one-command startup (Windows PowerShell)
#
# Usage:
#   .\start.ps1           # Docker + Ollama + PostgreSQL (recommended)
#   .\start.ps1 -Mock     # Docker without Ollama (mock AI, no GPU)
#   .\start.ps1 -Local    # No Docker — local Node + Ollama on host

param(
    [switch]$Mock,
    [switch]$Local,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

if ($Help) {
    Write-Host @"
Usage: .\start.ps1 [-Mock | -Local]

  (default)  Docker full stack: PostgreSQL + Ollama + app
  -Mock      Docker without Ollama (USE_MOCK_AI=1, no GPU needed)
  -Local     Run on host (requires Node, pnpm, PostgreSQL, Ollama)
"@
    exit 0
}

function Test-Command($Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

if ($Local) {
    Write-Host "==> Local mode" -ForegroundColor Cyan
    Set-Location "$Root\front"

    if (-not (Test-Path ".env.local")) {
        Write-Host "==> Creating .env.local from .env.example"
        Copy-Item ".env.example" ".env.local"
        $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
        (Get-Content ".env.local") -replace "^AUTH_SECRET=.*", "AUTH_SECRET=$secret" | Set-Content ".env.local"
        Write-Host "    Edit front\.env.local — set POSTGRES_URL before continuing." -ForegroundColor Yellow
        Write-Host "    Example: POSTGRES_URL=postgresql://brus:brus@localhost:5432/brus"
    }

    if (-not (Test-Command "pnpm")) {
        Write-Host "==> Installing pnpm..."
        npm install -g pnpm
    }

    Write-Host "==> Installing dependencies..."
    pnpm install

    Write-Host "==> Running database migrations..."
    pnpm db:migrate

    Write-Host "==> Starting dev server at http://localhost:3000" -ForegroundColor Green
    pnpm dev
    exit 0
}

if (-not (Test-Command "docker")) {
    Write-Host "ERROR: Docker not found. Install Docker Desktop or use: .\start.ps1 -Local" -ForegroundColor Red
    exit 1
}

$composeFile = if ($Mock) { "docker-compose.mock.yml" } else { "docker-compose.yml" }

Write-Host "==> Docker mode ($composeFile)" -ForegroundColor Cyan
Write-Host "    App:        http://localhost:3000"
if (-not $Mock) {
    Write-Host "    Ollama:     http://localhost:11434"
    Write-Host "    First run pulls llama3.2 — may take several minutes." -ForegroundColor Yellow
}
Write-Host "    PostgreSQL: localhost:5432  (user/brus/password/brus/db)"
Write-Host ""

docker compose -f $composeFile up --build

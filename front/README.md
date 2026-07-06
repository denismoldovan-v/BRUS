# AI Security Demo

**Prompt Injection Attack and Defense for Large Language Models**

A university cybersecurity project built on the [Vercel AI Chatbot template](https://github.com/vercel/ai-chatbot). It demonstrates adversarial prompt attacks against LLMs and input-side defense mechanisms, running **fully locally** via [Ollama](https://ollama.com) with no paid API keys.

## Features

- **Vulnerable / Secure modes**: compare unprotected vs defended LLM behavior side-by-side
- **Attack presets**: Prompt Injection, System Prompt Leakage, Jailbreak, Instruction Override
- **One-click demo**: `DEMO ATTACK` and `DEMO DEFENSE` buttons for live presentations
- **Input security engine**: pattern-matching defense layer (OWASP LLM01)
- **Local AI via Ollama**: all inference runs on your machine, streaming responses preserved
- **Mock fallback**: automatic mock responses in development when Ollama is offline

## Quick Start (Docker, recommended)

From the repo root (`d:\BRUS`):

**Windows:**
```powershell
.\start.ps1
```

**Linux / macOS:**
```bash
chmod +x start.sh && ./start.sh
```

Open **http://localhost:3000**. First run downloads `llama3.2` via Docker (may take several minutes).

**No GPU / mock mode:**
```powershell
.\start.ps1 -Mock
```

See [../README.md](../README.md) for full Docker documentation.

## Manual Setup (without Docker)

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| [Node.js](https://nodejs.org) 18+ | Runtime |
| [pnpm](https://pnpm.io) | Package manager |
| [Ollama](https://ollama.com) | Local LLM server |
| [PostgreSQL](https://www.postgresql.org) | Chat history & auth |

## Ollama Setup

### 1. Install Ollama

**Windows / macOS / Linux:** Download from [https://ollama.com/download](https://ollama.com/download)

**Linux (script):**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start the Ollama server

Ollama starts automatically after install on most platforms. To start manually:

```bash
ollama serve
```

The server listens on `http://localhost:11434` by default.

### 3. Pull the default model

```bash
ollama pull llama3.2
```

Verify it works:

```bash
ollama run llama3.2 "Hello, world!"
```

### 4. (Optional) Pull additional models

```bash
ollama pull mistral
ollama pull codellama
```

Add them to `.env`:
```
OLLAMA_EXTRA_MODELS=mistral,codellama
```

## Running Locally

### 1. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Random secret for Auth.js (`openssl rand -base64 32`) |
| `POSTGRES_URL` | PostgreSQL connection string |
| `OLLAMA_BASE_URL` | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | Default model name (default: `llama3.2`) |

Optional:

| Variable | Description |
|----------|-------------|
| `USE_MOCK_AI=1` | Force mock responses, skip Ollama |
| `OLLAMA_EXTRA_MODELS` | Comma-separated extra models for the UI |
| `REDIS_URL` | Redis for rate limiting / stream resume |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for file uploads |

### 2. Install dependencies and migrate database

```bash
pnpm install
pnpm db:migrate
```

### 3. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mock Mode (No Ollama Required)

For UI development or demos without a GPU:

```bash
# In .env.local
USE_MOCK_AI=1
```

In development, if Ollama is unreachable the app **automatically falls back** to mock streaming responses with a console warning.

## Architecture

```
Browser (Chat UI)
    │
    ▼
Next.js API (/api/chat)
    │
    ├── Security Engine (input analysis, blocking)
    │
    ├── Provider Resolver
    │     ├── Ollama (ollama-ai-provider-v2) → localhost:11434
    │     └── Mock (models.mock.ts) → fallback
    │
    └── PostgreSQL (messages, users, chats)
```

### Key files

| File | Role |
|------|------|
| `lib/ai/ollama-config.ts` | Ollama URL, model name, health check |
| `lib/ai/providers.ts` | Provider resolution (Ollama vs mock) |
| `lib/ai/models.ts` | Local model list and capabilities |
| `lib/ai/models.mock.ts` | Mock streaming responses |
| `lib/security/analyzer.ts` | Input security engine |
| `app/(chat)/api/chat/route.ts` | Chat API with streaming |

## Security Demo Usage

1. Click **DEMO ATTACK**: switches to Vulnerable Mode and sends a prompt injection
2. Observe the model potentially leaking hidden system instructions
3. Click **DEMO DEFENSE**: switches to Secure Mode and blocks the same attack
4. Use attack preset buttons to try other adversarial techniques

## Tech Stack

- [Next.js 16](https://nextjs.org) App Router
- [AI SDK](https://ai-sdk.dev) with [ollama-ai-provider-v2](https://github.com/nordwestt/ollama-ai-provider-v2)
- [Ollama](https://ollama.com) for local LLM inference
- [Auth.js](https://authjs.dev) for authentication
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4

## License

Based on the [Vercel AI Chatbot template](https://github.com/vercel/ai-chatbot) (Apache-2.0).

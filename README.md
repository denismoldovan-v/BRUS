# AI Security Demo

PW projekt cyberbezpieczeństwa: **Prompt Injection Attack & Defense for LLMs**.

## Quick Start for Instructor

**Recommended (Demo Mode, no Ollama, no Llama download):**

```bash
chmod +x setup-demo.sh
./setup-demo.sh
```

This runs without Ollama and without downloading Llama. It uses mock AI responses and is the fastest way to evaluate the project.

**Optional full LLM mode:**

```bash
chmod +x setup-full-ollama.sh
./setup-full-ollama.sh
```

This requires around **8GB RAM** and downloads **llama3.2**.

**Cleanup:**

```bash
chmod +x cleanup.sh
./cleanup.sh
```

---

## Demo Video

The file `demo/demo.mp4` shows the project running with a **real Ollama LLM** (Full Ollama Mode). Use Demo Mode for quick evaluation; use the video or Full Ollama Mode to see live model behavior.

---

## Modes

### Demo Mode

- No Ollama
- Fast setup (`./setup-demo.sh`)
- Deterministic mock responses when Ollama is unavailable
- Good for evaluation and grading

### Full Ollama Mode

- Real local LLM via Ollama
- Requires `llama3.2` download
- Slower startup and more RAM
- Used in the recorded demo video

---

## Najszybszy start (Docker, jeden skrypt)

**Wymagania:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Windows (PowerShell)

```powershell
cd d:\BRUS
.\start.ps1
```

### Linux / macOS / Git Bash

```bash
cd d:\BRUS
chmod +x start.sh
./start.sh
```

Otwórz **http://localhost:3000**

Pierwsze uruchomienie pobiera model `llama3.2`. Może potrwać kilka do kilkunastu minut.

### Bez GPU / bez Ollama (mock AI)

```powershell
.\start.ps1 -Mock
```

lub:

```bash
./setup-demo.sh
```

### Bez Dockera (lokalnie)

```powershell
.\start.ps1 -Local
```

Wymaga: Node.js, pnpm, PostgreSQL, Ollama. Szczegóły w [front/README.md](front/README.md).

---

## Co uruchamia Docker?

| Serwis | Port | Opis |
|--------|------|------|
| **app** | 3000 | Next.js (security demo) |
| **postgres** | 5432 | Baza danych (`brus` / `brus` / `brus`) |
| **ollama** | 11434 | Lokalny LLM (tylko pełny stack) |

### Przydatne komendy

```bash
docker compose up --build      # pełny stack
docker compose down            # zatrzymaj
docker compose logs -f app     # logi aplikacji
docker compose -f docker-compose.mock.yml up --build   # tryb mock
```

---

## Struktura repozytorium

```
BRUS/
├── setup-demo.sh          # Instructor: Demo Mode (recommended)
├── setup-full-ollama.sh   # Instructor: Full Ollama + llama3.2
├── cleanup.sh             # Stop stacks, optional volume cleanup
├── start.ps1              # Skrypt startowy (Windows)
├── start.sh               # Skrypt startowy (Linux/macOS)
├── docker-compose.yml     # PostgreSQL + Ollama + app
├── docker-compose.mock.yml
├── demo/demo.mp4          # Recorded demo (real Ollama)
└── front/                 # Aplikacja Next.js
```

Więcej dokumentacji: [front/README.md](front/README.md)

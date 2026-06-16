# AI Security Demo

Uniwersytecki projekt cyberbezpieczeństwa — **Prompt Injection Attack & Defense for LLMs**.

## Najszybszy start (Docker — jeden skrypt)

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

Pierwsze uruchomienie pobiera model `llama3.2` — może potrwać kilka–kilkanaście minut.

### Bez GPU / bez Ollama (mock AI)

```powershell
.\start.ps1 -Mock
```

### Bez Dockera (lokalnie)

```powershell
.\start.ps1 -Local
```

Wymaga: Node.js, pnpm, PostgreSQL, Ollama — szczegóły w [front/README.md](front/README.md).

---

## Co uruchamia Docker?

| Serwis | Port | Opis |
|--------|------|------|
| **app** | 3000 | Next.js (chat + security demo) |
| **postgres** | 5432 | Baza danych (`brus` / `brus` / `brus`) |
| **ollama** | 11434 | Lokalny LLM (tylko pełny stack) |

### Przydatne komendy

```powershell
docker compose up --build      # pełny stack
docker compose down            # zatrzymaj
docker compose logs -f app     # logi aplikacji
docker compose -f docker-compose.mock.yml up --build   # tryb mock
```

---

## Struktura repozytorium

```
BRUS/
├── start.ps1              # Skrypt startowy (Windows)
├── start.sh               # Skrypt startowy (Linux/macOS)
├── docker-compose.yml     # PostgreSQL + Ollama + app
├── docker-compose.mock.yml
└── front/                 # Aplikacja Next.js
```

Więcej dokumentacji: [front/README.md](front/README.md)

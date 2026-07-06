/**
 * Ollama configuration. All AI inference runs locally via Ollama.
 *
 * No external LLM API keys are required or supported:
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY,
 *   XAI_API_KEY, and AI_GATEWAY_API_KEY are NOT used by this application.
 *
 * Environment variables:
 *   OLLAMA_BASE_URL  - Ollama server URL (default: http://localhost:11434)
 *   OLLAMA_MODEL     - Default chat model (default: llama3.2)
 *   USE_MOCK_AI      - Force mock responses, skip Ollama (default: 0)
 */

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

/** Comma-separated list of additional models to expose in the UI. */
export const OLLAMA_EXTRA_MODELS = (process.env.OLLAMA_EXTRA_MODELS ?? "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export const USE_MOCK_AI = process.env.USE_MOCK_AI === "1";

/** Health-check endpoint for locally available models. */
export const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;

/**
 * Ping Ollama to verify it is running and reachable.
 * Uses a 3-second timeout so chat requests fail fast when Ollama is down.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(OLLAMA_TAGS_URL, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Fetch model names reported by the local Ollama instance. */
export async function fetchOllamaModelNames(): Promise<string[]> {
  try {
    const response = await fetch(OLLAMA_TAGS_URL, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as {
      models?: Array<{ name: string }>;
    };
    return (json.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

export function formatModelDisplayName(modelId: string): string {
  return modelId
    .split(":")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

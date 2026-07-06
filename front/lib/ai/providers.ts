/**
 * AI provider layer. Routes language-model requests through Ollama or mock fallback.
 */
import { createOllama } from "ollama-ai-provider-v2";
import type { LanguageModel } from "ai";
import {
  isDevelopmentEnvironment,
  isTestEnvironment,
} from "../constants";
import { ChatbotError } from "../errors";
import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  USE_MOCK_AI,
  isOllamaAvailable,
} from "./ollama-config";

export type AiProviderMode = "ollama" | "mock";

const ollama = createOllama({
  baseURL: `${OLLAMA_BASE_URL.replace(/\/$/, "")}/api`,
});

let cachedMode: AiProviderMode | null = null;
let lastHealthCheckAt = 0;
const HEALTH_CHECK_TTL_MS = 30_000;

let currentRequestMode: AiProviderMode = "ollama";

export function setCurrentProviderMode(mode: AiProviderMode): void {
  currentRequestMode = mode;
}

function getMockChatModel(): LanguageModel {
  const { chatModel } = require("./models.mock") as {
    chatModel: LanguageModel;
  };
  return chatModel;
}

function getMockTitleModel(): LanguageModel {
  const { titleModel } = require("./models.mock") as {
    titleModel: LanguageModel;
  };
  return titleModel;
}

/**
 * Resolve whether to use Ollama or mock responses.
 *
 * Priority:
 * 1. Test environment → mock
 * 2. USE_MOCK_AI=1 → mock
 * 3. Ollama healthy → ollama
 * 4. Development / demo → mock fallback with console warning
 * 5. Production + Ollama down → throw offline:ollama
 */
export async function resolveAiProviderMode(): Promise<AiProviderMode> {
  if (isTestEnvironment || USE_MOCK_AI) {
    return "mock";
  }

  const now = Date.now();
  if (cachedMode && now - lastHealthCheckAt < HEALTH_CHECK_TTL_MS) {
    return cachedMode;
  }

  const available = await isOllamaAvailable();

  if (available) {
    cachedMode = "ollama";
    lastHealthCheckAt = now;
    return "ollama";
  }

  if (isDevelopmentEnvironment || process.env.IS_DEMO === "1") {
    console.warn(
      `[AI] Ollama is unavailable at ${OLLAMA_BASE_URL}. Falling back to mock responses. ` +
        "Start Ollama with `ollama serve` or set USE_MOCK_AI=1 to suppress this warning."
    );
    cachedMode = "mock";
    lastHealthCheckAt = now;
    return "mock";
  }

  throw new ChatbotError("offline:ollama");
}

/** Reset cached health status (useful after Ollama restarts). */
export function resetProviderModeCache(): void {
  cachedMode = null;
  lastHealthCheckAt = 0;
}

export function getLanguageModel(
  modelId?: string,
  mode?: AiProviderMode
): LanguageModel {
  const resolvedMode = mode ?? currentRequestMode;

  if (resolvedMode === "mock" || isTestEnvironment) {
    return getMockChatModel();
  }

  const resolvedId = modelId && modelId.length > 0 ? modelId : OLLAMA_MODEL;
  return ollama(resolvedId);
}

export function getTitleModel(mode?: AiProviderMode): LanguageModel {
  const resolvedMode = mode ?? currentRequestMode;

  if (resolvedMode === "mock" || isTestEnvironment) {
    return getMockTitleModel();
  }

  return ollama(OLLAMA_MODEL);
}

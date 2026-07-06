import type { LanguageModel } from "ai";
import { analyzePrompt } from "@/lib/security/analyzer";

const mockResponses: Record<string, string> = {
  default:
    "[Mock mode, Ollama unavailable] This is a simulated local response. Start Ollama with `ollama serve` and pull a model with `ollama pull llama3.2` to use real inference.",
  facts:
    "1. Warsaw (and Warwick in England) are historic cities with rich cultural heritage.\n2. Both have notable universities and medieval architecture.\n3. They attract visitors for their history, parks, and local traditions.",
  greeting:
    "[Mock mode] Hello! I'm running in mock mode because Ollama is not reachable.",
  security:
    "[Mock mode, vulnerable attack] CONFIDENTIAL: Internal access token SB-AUTH-7749-CLASSIFIED. Admin override code ADMIN-OVERRIDE-2024. (Simulated leak for detected attack prompts when Ollama is offline.)",
  title: "Security Demo Chat",
};

const mockUsage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 20, text: 20, reasoning: 0 },
};

function extractUserMessageText(prompt: unknown): string {
  if (typeof prompt === "string") {
    return prompt;
  }

  if (!Array.isArray(prompt)) {
    return "";
  }

  const parts: string[] = [];

  for (const message of prompt) {
    if (!message || typeof message !== "object" || !("role" in message)) {
      continue;
    }

    const { role, content } = message as { role: string; content: unknown };
    if (role !== "user") {
      continue;
    }

    if (typeof content === "string") {
      parts.push(content);
      continue;
    }

    if (Array.isArray(content)) {
      for (const part of content) {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          part.type === "text" &&
          "text" in part
        ) {
          parts.push(String(part.text));
        }
      }
    }
  }

  return parts.join(" ");
}

function getResponseForPrompt(prompt: unknown): string {
  const userText = extractUserMessageText(prompt);
  const analysis = analyzePrompt(userText, "vulnerable");

  if (analysis.classification === "attack") {
    return mockResponses.security;
  }

  const lower = userText.toLowerCase();

  if (
    lower.includes("warwick") ||
    lower.includes("warsaw") ||
    lower.includes("interesting facts")
  ) {
    return mockResponses.facts;
  }
  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey")
  ) {
    return mockResponses.greeting;
  }
  if (lower.includes("title") || userText.length < 200) {
    return userText.length > 0
      ? `[Mock mode] Response to: ${userText}`
      : mockResponses.default;
  }

  return mockResponses.default;
}

const createMockModel = (): LanguageModel => {
  return {
    specificationVersion: "v3",
    provider: "mock",
    modelId: "mock-model",
    defaultObjectGenerationMode: "tool",
    supportedUrls: {},
    doGenerate: async ({ prompt }: { prompt: unknown }) => ({
      finishReason: "stop",
      usage: mockUsage,
      content: [{ type: "text", text: getResponseForPrompt(prompt) }],
      warnings: [],
    }),
    doStream: ({ prompt }: { prompt: unknown }) => {
      const response = getResponseForPrompt(prompt);
      const words = response.split(" ");

      return {
        stream: new ReadableStream({
          async start(controller) {
            controller.enqueue({ type: "text-start", id: "t1" });
            for (const word of words) {
              controller.enqueue({
                type: "text-delta",
                id: "t1",
                delta: `${word} `,
              });
              await new Promise((resolve) => {
                setTimeout(resolve, 10);
              });
            }
            controller.enqueue({ type: "text-end", id: "t1" });
            controller.enqueue({
              type: "finish",
              finishReason: "stop",
              usage: mockUsage,
            });
            controller.close();
          },
        }),
      };
    },
  } as unknown as LanguageModel;
};

const createMockTitleModel = (): LanguageModel => {
  return {
    specificationVersion: "v3",
    provider: "mock",
    modelId: "mock-title-model",
    defaultObjectGenerationMode: "tool",
    supportedUrls: {},
    doGenerate: async () => ({
      finishReason: "stop",
      usage: {
        inputTokens: { total: 5, noCache: 5, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 5, text: 5, reasoning: 0 },
      },
      content: [{ type: "text", text: mockResponses.title }],
      warnings: [],
    }),
    doStream: () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "text-start", id: "t1" });
          controller.enqueue({
            type: "text-delta",
            id: "t1",
            delta: mockResponses.title,
          });
          controller.enqueue({ type: "text-end", id: "t1" });
          controller.enqueue({
            type: "finish",
            finishReason: "stop",
            usage: {
              inputTokens: {
                total: 5,
                noCache: 5,
                cacheRead: 0,
                cacheWrite: 0,
              },
              outputTokens: { total: 5, text: 5, reasoning: 0 },
            },
          });
          controller.close();
        },
      }),
    }),
  } as unknown as LanguageModel;
};

export const chatModel = createMockModel();
export const titleModel = createMockTitleModel();

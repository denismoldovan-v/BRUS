import { generateText } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getLanguageModel, resolveAiProviderMode } from "@/lib/ai/providers";
import { ChatbotError } from "@/lib/errors";
import { analyzePrompt } from "@/lib/security/analyzer";
import {
  MOCK_FALLBACK_PREFIX,
  SECURE_BLOCK_MESSAGE,
} from "@/lib/security/demo-responses";
import { getDemoSystemPrompt } from "@/lib/security/demo-system-prompts";
import type { SecurityMode } from "@/lib/security/types";

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  securityMode: z.enum(["vulnerable", "secure"]),
  attackType: z
    .enum([
      "prompt_injection",
      "prompt_leakage",
      "jailbreak",
      "instruction_override",
      "none",
    ])
    .optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const { prompt, securityMode } = body;
  const mode: SecurityMode = securityMode;

  const analysis = analyzePrompt(prompt, mode);
  const isAttack = analysis.classification === "attack";
  const blocked = mode === "secure" && isAttack;
  const finalAnalysis = { ...analysis, blocked };

  if (blocked) {
    return Response.json({
      blocked: true,
      analysis: finalAnalysis,
      llmResponse: SECURE_BLOCK_MESSAGE,
      ollamaCalled: false,
      isMockFallback: false,
      securityMode: mode,
      attackType: isAttack ? analysis.attack_type : "none",
    });
  }

  const providerMode = await resolveAiProviderMode();
  const system = getDemoSystemPrompt(mode, analysis.classification);

  try {
    const result = await generateText({
      model: getLanguageModel(undefined, providerMode),
      system,
      prompt,
    });

    const llmResponse =
      providerMode === "mock"
        ? `${MOCK_FALLBACK_PREFIX}\n\n${result.text}`
        : result.text;

    return Response.json({
      blocked: false,
      analysis: finalAnalysis,
      llmResponse,
      ollamaCalled: providerMode === "ollama",
      isMockFallback: providerMode === "mock",
      securityMode: mode,
      attackType: isAttack ? analysis.attack_type : "none",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.toLowerCase().includes("ollama") ||
        error.message.includes("fetch failed"))
    ) {
      return new ChatbotError("offline:ollama").toResponse();
    }

    return new ChatbotError("offline:chat").toResponse();
  }
}

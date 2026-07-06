import {
  DEFAULT_CHAT_MODEL,
  getActiveModels,
  getAllLocalModels,
  getCapabilities,
} from "@/lib/ai/models";
import { resolveAiProviderMode } from "@/lib/ai/providers";

export async function GET() {
  const headers = {
    "Cache-Control": "public, max-age=60, s-maxage=60",
  };

  const providerMode = await resolveAiProviderMode();
  const curatedCapabilities = await getCapabilities();
  const models =
    providerMode === "ollama"
      ? await getAllLocalModels()
      : getActiveModels().map((model) => ({
          ...model,
          capabilities: curatedCapabilities[model.id] ?? {
            tools: false,
            vision: false,
            reasoning: false,
          },
        }));

  const capabilities = Object.fromEntries(
    models.map((m) => [
      m.id,
      curatedCapabilities[m.id] ??
        ("capabilities" in m ? m.capabilities : undefined) ?? {
          tools: false,
          vision: false,
          reasoning: false,
        },
    ])
  );

  return Response.json(
    {
      capabilities,
      models,
      provider: providerMode,
      defaultModel: DEFAULT_CHAT_MODEL,
    },
    { headers }
  );
}

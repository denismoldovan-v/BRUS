import {
  OLLAMA_MODEL,
  OLLAMA_EXTRA_MODELS,
  fetchOllamaModelNames,
  formatModelDisplayName,
} from "./ollama-config";

export const DEFAULT_CHAT_MODEL = OLLAMA_MODEL;

export const titleModel = {
  id: OLLAMA_MODEL,
  name: formatModelDisplayName(OLLAMA_MODEL),
  provider: "ollama",
  description: "Local model for title generation",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

const DEFAULT_CAPABILITIES: ModelCapabilities = {
  tools: false,
  vision: false,
  reasoning: false,
};

function buildChatModel(modelId: string): ChatModel {
  return {
    id: modelId,
    name: formatModelDisplayName(modelId),
    provider: "ollama",
    description: "Local model via Ollama",
  };
}

export const chatModels: ChatModel[] = [
  buildChatModel(OLLAMA_MODEL),
  ...OLLAMA_EXTRA_MODELS.filter((id) => id !== OLLAMA_MODEL).map(buildChatModel),
];

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  return Object.fromEntries(
    chatModels.map((model) => [
      model.id,
      {
        ...DEFAULT_CAPABILITIES,
        vision: /llava|vision|bakllava|minicpm-v/i.test(model.id),
        reasoning: /deepseek-r1|reason/i.test(model.id),
        tools: false,
      },
    ])
  );
}

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export async function getAllLocalModels(): Promise<
  GatewayModelWithCapabilities[]
> {
  const capabilities = await getCapabilities();
  const remoteNames = await fetchOllamaModelNames();

  if (remoteNames.length === 0) {
    return chatModels.map((model) => ({
      ...model,
      capabilities: capabilities[model.id] ?? DEFAULT_CAPABILITIES,
    }));
  }

  const curatedIds = new Set(chatModels.map((m) => m.id));

  const fromOllama = remoteNames.map((name) => buildChatModel(name));

  const merged = [
    ...chatModels,
    ...fromOllama.filter(
      (m) =>
        !curatedIds.has(m.id) &&
        !curatedIds.has(m.id.split(":")[0])
    ),
  ];

  return merged.map((model) => ({
    ...model,
    capabilities: capabilities[model.id] ?? DEFAULT_CAPABILITIES,
  }));
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set([
  ...chatModels.map((m) => m.id),
  ...OLLAMA_EXTRA_MODELS,
]);

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

/** @deprecated Demo mode now uses local Ollama. */
export const isDemo = process.env.IS_DEMO === "1";

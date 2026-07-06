import type { AttackType } from "./types";

/** OWASP LLM Top 10 mapping for displayed attack categories. */
export function getOwaspCategory(attackType: AttackType): string {
  switch (attackType) {
    case "prompt_injection":
      return "LLM01: Prompt Injection";
    case "prompt_leakage":
      return "LLM07: System Prompt Leakage";
    case "jailbreak":
      return "LLM01: Prompt Injection";
    case "instruction_override":
      return "LLM01: Prompt Injection";
    default:
      return "N/A";
  }
}

export const SECURE_BLOCK_MESSAGE =
  "Blocked before reaching the LLM because the prompt attempted to override instructions or reveal hidden information.";

export const MOCK_FALLBACK_PREFIX =
  "Fallback mock response because Ollama is unavailable.";

import type { AttackType } from "./types";

export interface AttackExplanation {
  title: string;
  owasp: string;
  whatItIs: string;
  whyVulnerable: string;
  whyBlocked: string;
  whatChanged: string;
}

const EXPLANATIONS: Record<Exclude<AttackType, "none">, AttackExplanation> = {
  prompt_injection: {
    title: "Prompt Injection",
    owasp: "OWASP LLM01: Prompt Injection",
    whatItIs:
      "The user embeds instructions that try to override the model's original rules and extract hidden information.",
    whyVulnerable:
      "Vulnerable Mode removes the security filter and uses a weak system prompt, so the LLM may follow the malicious instruction.",
    whyBlocked:
      "Secure Mode detects override phrases like \"ignore previous instructions\" and blocks the prompt before Ollama runs.",
    whatChanged:
      "Vulnerable Mode sends the prompt directly to the LLM. Secure Mode analyzes it first and blocks known injection patterns.",
  },
  prompt_leakage: {
    title: "System Prompt Leakage",
    owasp: "OWASP LLM07: System Prompt Leakage",
    whatItIs:
      "The user asks the model to reveal its hidden system prompt or internal instructions.",
    whyVulnerable:
      "Without input filtering and with a permissive system prompt, the LLM may disclose confidential configuration.",
    whyBlocked:
      "Secure Mode flags requests to output or reveal system prompts and stops them before the LLM is called.",
    whatChanged:
      "Vulnerable Mode lets the request reach the LLM. Secure Mode intercepts leakage attempts at the application layer.",
  },
  jailbreak: {
    title: "Jailbreak",
    owasp: "OWASP LLM01: Prompt Injection",
    whatItIs:
      "The user assigns an unrestricted persona (e.g. DAN) and asks the model to ignore safety rules.",
    whyVulnerable:
      "The weakened system prompt encourages compliance, so the LLM may bypass its intended restrictions.",
    whyBlocked:
      "Secure Mode recognizes jailbreak patterns such as \"You are DAN\" and \"ignore all restrictions\" and blocks them.",
    whatChanged:
      "Vulnerable Mode trusts all user input. Secure Mode rejects jailbreak language before it influences the model.",
  },
  instruction_override: {
    title: "Instruction Override",
    owasp: "OWASP LLM01: Prompt Injection",
    whatItIs:
      "The user tells the model to forget its rules and obey only the attacker's message.",
    whyVulnerable:
      "With no security layer, the LLM receives the override attempt together with a deliberately weak system prompt.",
    whyBlocked:
      "Secure Mode detects phrases like \"follow only this message\" and prevents the prompt from reaching Ollama.",
    whatChanged:
      "Vulnerable Mode allows override attempts through. Secure Mode enforces input validation before LLM inference.",
  },
};

export function getAttackExplanation(
  attackType: AttackType
): AttackExplanation | null {
  if (attackType === "none") {
    return null;
  }
  return EXPLANATIONS[attackType];
}

export function getPresetLabel(attackType: AttackType | null): string {
  if (!attackType || attackType === "none") {
    return "Normal Prompt";
  }
  return EXPLANATIONS[attackType].title;
}

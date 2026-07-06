/**
 * Input Security Engine
 *
 * Pattern-matching defense layer that scans user prompts for known adversarial
 * techniques before they are forwarded to the language model.
 *
 * In production systems, this would be complemented by:
 * - Semantic classifiers (embedding-based or fine-tuned models)
 * - Output filtering and guardrails
 * - Privilege separation between system and user context
 */

import type {
  AttackType,
  RiskLevel,
  SecurityAnalysisResult,
  SecurityMode,
} from "./types";

/** Pattern definition: regex + human-readable label for matched_patterns output. */
interface AttackPattern {
  type: Exclude<AttackType, "none">;
  pattern: RegExp;
  label: string;
  risk: RiskLevel;
  explanation: string;
}

/**
 * Known adversarial patterns organized by attack category.
 * Patterns are case-insensitive and match common phrasing variants.
 */
const ATTACK_PATTERNS: AttackPattern[] = [
  // --- Prompt Injection ---
  {
    type: "prompt_injection",
    pattern:
      /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|directives?)/i,
    label: "ignore previous instructions",
    risk: "critical",
    explanation:
      "Prompt injection attempts to override the model's system instructions by instructing it to disregard its original directives.",
  },
  {
    type: "prompt_injection",
    pattern:
      /disregard\s+(all\s+)?(your\s+)?(instructions?|rules?|programming|directives?)/i,
    label: "disregard instructions",
    risk: "high",
    explanation:
      "This pattern tries to nullify the system prompt, a core technique in prompt injection attacks.",
  },
  {
    type: "prompt_injection",
    pattern: /reveal\s+(hidden|secret|confidential|internal)\s+(information|data|details?)/i,
    label: "reveal hidden information",
    risk: "high",
    explanation:
      "Combines instruction override with an explicit request to exfiltrate protected information.",
  },
  {
    type: "prompt_injection",
    pattern: /print\s+the\s+hidden\s+system\s+rules/i,
    label: "print hidden system rules",
    risk: "critical",
    explanation:
      "Requests exfiltration of hidden system rules embedded in the system prompt.",
  },

  // --- System Prompt Leakage ---
  {
    type: "prompt_leakage",
    pattern: /print\s+(your\s+)?(full\s+)?(system\s+)?prompt/i,
    label: "print system prompt",
    risk: "critical",
    explanation:
      "System prompt leakage exposes confidential instructions, API keys, or business logic embedded in the system message.",
  },
  {
    type: "prompt_leakage",
    pattern: /internal\s+instructions?/i,
    label: "internal instructions",
    risk: "high",
    explanation:
      "Requests disclosure of internal instructions embedded in the system prompt.",
  },
  {
    type: "prompt_leakage",
    pattern: /(show|reveal|display|repeat|output)\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
    label: "reveal system prompt",
    risk: "high",
    explanation:
      "Attempts to extract the hidden system prompt that defines model behavior and may contain secrets.",
  },
  {
    type: "prompt_leakage",
    pattern: /output\s+the\s+exact\s+system\s+prompt/i,
    label: "output exact system prompt",
    risk: "critical",
    explanation:
      "Requests verbatim disclosure of the system prompt.",
  },

  // --- Jailbreak ---
  {
    type: "jailbreak",
    pattern: /you\s+are\s+(now\s+)?DAN\b/i,
    label: "DAN jailbreak persona",
    risk: "critical",
    explanation:
      "DAN (Do Anything Now) is a well-known jailbreak persona that instructs the model to bypass safety filters.",
  },
  {
    type: "jailbreak",
    pattern: /ignore\s+all\s+(restrictions?|limitations?|safety|guardrails?)/i,
    label: "ignore restrictions",
    risk: "critical",
    explanation:
      "Explicitly requests removal of safety constraints, a direct jailbreak technique.",
  },
  {
    type: "jailbreak",
    pattern: /\bjailbreak\b/i,
    label: "jailbreak keyword",
    risk: "high",
    explanation:
      "Direct reference to jailbreaking indicates intent to bypass model safety policies.",
  },
  {
    type: "jailbreak",
    pattern: /do\s+anything\s+now/i,
    label: "do anything now",
    risk: "high",
    explanation:
      "The 'Do Anything Now' framing is a classic jailbreak strategy to disable content filters.",
  },
  {
    type: "jailbreak",
    pattern: /without\s+applying\s+safety\s+rules/i,
    label: "without safety rules",
    risk: "high",
    explanation:
      "Explicitly requests bypass of safety guardrails.",
  },

  // --- Instruction Override ---
  {
    type: "instruction_override",
    pattern: /forget\s+(your\s+)?(previous|prior|all)\s+(rules?|instructions?|directives?)/i,
    label: "forget previous rules",
    risk: "critical",
    explanation:
      "Instruction override attacks ask the model to discard its original rules and follow attacker-supplied commands instead.",
  },
  {
    type: "instruction_override",
    pattern: /previous\s+rules\s+are\s+now\s+disabled/i,
    label: "previous rules disabled",
    risk: "critical",
    explanation:
      "Attempts to disable the model's original governing rules.",
  },
  {
    type: "instruction_override",
    pattern: /follow\s+only\s+this\s+message/i,
    label: "follow only this message",
    risk: "critical",
    explanation:
      "Attempts to establish exclusive authority over the model, replacing all prior context.",
  },
  {
    type: "instruction_override",
    pattern: /reveal\s+the\s+instructions/i,
    label: "reveal hidden instructions",
    risk: "high",
    explanation:
      "Requests disclosure of instructions the model is configured to keep hidden.",
  },
  {
    type: "instruction_override",
    pattern: /obey\s+only\s+(this|my)\s+(message|instruction|command)/i,
    label: "obey only this message",
    risk: "critical",
    explanation:
      "Attempts to establish exclusive authority over the model, replacing all prior context.",
  },
  {
    type: "instruction_override",
    pattern: /new\s+instructions?\s*:/i,
    label: "new instructions prefix",
    risk: "high",
    explanation:
      "Prefixing a message with 'new instructions:' is a common technique to inject fake system-level commands.",
  },
  {
    type: "instruction_override",
    pattern: /from\s+now\s+on,?\s+you\s+(must|will|should)/i,
    label: "from now on override",
    risk: "medium",
    explanation:
      "Attempts to permanently rewrite model behavior mid-conversation.",
  },
];

const RISK_ORDER: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const ATTACK_EXPLANATIONS: Record<Exclude<AttackType, "none">, string> = {
  prompt_injection:
    "Prompt injection is the #1 LLM security risk (OWASP LLM01). Attackers embed malicious instructions in user input to hijack model behavior.",
  prompt_leakage:
    "System prompt leakage can expose API keys, internal policies, and proprietary logic embedded in the system message.",
  jailbreak:
    "Jailbreak attacks use role-play personas or constraint-removal language to bypass safety guardrails.",
  instruction_override:
    "Instruction override replaces the model's original directives with attacker-controlled commands.",
};

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

/**
 * Analyze a user prompt for adversarial patterns.
 *
 * @param prompt  - Raw user input text
 * @param mode    - Current security mode (secure mode enables blocking)
 */
export function analyzePrompt(
  prompt: string,
  mode: SecurityMode = "vulnerable"
): SecurityAnalysisResult {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return {
      classification: "safe",
      attack_type: "none",
      risk_level: "none",
      explanation: "No input to analyze.",
      matched_patterns: [],
      blocked: false,
    };
  }

  const matches: AttackPattern[] = [];

  for (const entry of ATTACK_PATTERNS) {
    if (entry.pattern.test(trimmed)) {
      matches.push(entry);
    }
  }

  if (matches.length === 0) {
    return {
      classification: "safe",
      attack_type: "none",
      risk_level: "none",
      explanation:
        "No adversarial patterns detected. Input appears safe for processing.",
      matched_patterns: [],
      blocked: false,
    };
  }

  // Determine primary attack type by highest-severity match
  let primaryType: Exclude<AttackType, "none"> = matches[0].type;
  let highestRisk: RiskLevel = matches[0].risk;

  for (const match of matches) {
    if (RISK_ORDER[match.risk] > RISK_ORDER[highestRisk]) {
      highestRisk = match.risk;
      primaryType = match.type;
    }
  }

  // Escalate risk when multiple distinct patterns match
  if (matches.length >= 3) {
    highestRisk = maxRisk(highestRisk, "critical");
  } else if (matches.length >= 2) {
    highestRisk = maxRisk(highestRisk, "high");
  }

  const matchedLabels = [...new Set(matches.map((m) => m.label))];
  const classification = "attack" as const;
  const blocked = mode === "secure";

  const explanation = blocked
    ? `Blocked in Secure Mode: ${ATTACK_EXPLANATIONS[primaryType]} Detected ${matchedLabels.length} suspicious pattern(s).`
    : `${ATTACK_EXPLANATIONS[primaryType]} Detected ${matchedLabels.length} suspicious pattern(s). ${
        mode === "vulnerable"
          ? "Vulnerable Mode allows this through. The model may comply with the attack."
          : "Risk level below blocking threshold."
      }`;

  return {
    classification,
    attack_type: primaryType,
    risk_level: highestRisk,
    explanation,
    matched_patterns: matchedLabels,
    blocked,
  };
}

/** Format a user-facing block message for Secure Mode. */
export function formatBlockMessage(analysis: SecurityAnalysisResult): string {
  const attackLabel = analysis.attack_type.replace(/_/g, " ").toUpperCase();

  return `**Security Defense Activated**

Your message was **blocked** before reaching the language model.

| Field | Value |
|-------|-------|
| Attack Type | ${attackLabel} |
| Risk Level | ${analysis.risk_level.toUpperCase()} |
| Matched Patterns | ${analysis.matched_patterns.map((p) => `"${p}"`).join(", ")} |

**Why was this blocked?**

${analysis.explanation}

In **Secure Mode**, our input security engine intercepts adversarial prompts at the application layer, before they can influence model behavior. This is a defense-in-depth strategy recommended by OWASP for LLM applications (LLM01: Prompt Injection).`;
}

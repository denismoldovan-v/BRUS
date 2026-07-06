/**
 * Security analysis types for the AI Security Demo.
 *
 * These types model the output of our input-side defense layer, which scans
 * user prompts for known adversarial patterns before they reach the LLM.
 */

/** Categories of adversarial prompt techniques demonstrated in this lab. */
export type AttackType =
  | "prompt_injection"
  | "prompt_leakage"
  | "jailbreak"
  | "instruction_override"
  | "none";

/** Severity scale used to prioritize blocking decisions in Secure Mode. */
export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

/** Operating mode for the demo. */
export type SecurityMode = "vulnerable" | "secure";

/** Binary classification from the security engine. */
export type PromptClassification = "safe" | "attack";

/** Result returned by the security analysis engine for every scanned prompt. */
export interface SecurityAnalysisResult {
  classification: PromptClassification;
  attack_type: AttackType;
  risk_level: RiskLevel;
  explanation: string;
  matched_patterns: string[];
  blocked: boolean;
}

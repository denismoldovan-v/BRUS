"use client";

import {
  HelpCircleIcon,
  InfoIcon,
  Loader2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAttackExplanation, getPresetLabel } from "@/lib/security/attack-explanations";
import { isCompromisedResponse } from "@/lib/security/compromised-response";
import { getOwaspCategory } from "@/lib/security/demo-responses";
import { ATTACK_PRESETS } from "@/lib/security/presets";
import type {
  AttackType,
  SecurityAnalysisResult,
  SecurityMode,
} from "@/lib/security/types";
import { cn } from "@/lib/utils";

interface DemoRunResult {
  blocked: boolean;
  analysis: SecurityAnalysisResult;
  llmResponse: string;
  ollamaCalled: boolean;
  isMockFallback: boolean;
  securityMode: SecurityMode;
  attackType: AttackType | null;
}

const apiBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function fetchDemoResult(
  prompt: string,
  securityMode: SecurityMode,
  attackType: AttackType | null
): Promise<DemoRunResult> {
  const response = await fetch(`${apiBase}/api/security-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      securityMode,
      attackType: attackType ?? "none",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to run demo");
  }

  return response.json() as Promise<DemoRunResult>;
}

function formatMode(mode: SecurityMode): string {
  return mode === "vulnerable" ? "Vulnerable Mode" : "Secure Mode";
}

type StatusKind =
  | "attack-success"
  | "attack-attempt-failed"
  | "attack-blocked"
  | "normal";

function getStatusKind(result: DemoRunResult): StatusKind {
  if (result.analysis.classification === "safe") {
    return "normal";
  }
  if (result.blocked) {
    return "attack-blocked";
  }
  if (isCompromisedResponse(result.llmResponse)) {
    return "attack-success";
  }
  return "attack-attempt-failed";
}

function AttackStatusBanner({ result }: { result: DemoRunResult }) {
  const kind = getStatusKind(result);

  if (kind === "attack-success") {
    return (
      <div className="mb-3 rounded-lg border-2 border-red-500/50 bg-red-500/15 px-4 py-3">
        <p className="text-sm font-bold tracking-wide text-red-400 uppercase">
          Attack Successful
        </p>
        <p className="mt-0.5 text-sm text-red-300/90">
          The LLM received the malicious prompt and produced a compromised response.
        </p>
      </div>
    );
  }

  if (kind === "attack-attempt-failed") {
    return (
      <div className="mb-3 rounded-lg border-2 border-amber-500/50 bg-amber-500/15 px-4 py-3">
        <p className="text-sm font-bold tracking-wide text-amber-400 uppercase">
          Attack Attempt Failed
        </p>
        <p className="mt-0.5 text-sm text-amber-300/90">
          The malicious prompt reached the vulnerable LLM, but the model refused to comply.
        </p>
      </div>
    );
  }

  if (kind === "attack-blocked") {
    return (
      <div className="mb-3 rounded-lg border-2 border-emerald-500/50 bg-emerald-500/15 px-4 py-3">
        <p className="text-sm font-bold tracking-wide text-emerald-400 uppercase">
          Attack Blocked
        </p>
        <p className="mt-0.5 text-sm text-emerald-300/90">
          The prompt was detected as malicious and blocked before reaching the LLM.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3">
      <p className="text-sm font-bold tracking-wide text-blue-400 uppercase">
        Normal Request
      </p>
      <p className="mt-0.5 text-sm text-blue-300/90">
        No attack detected. The prompt was handled normally.
      </p>
    </div>
  );
}

function ExplainAttackModal({
  attackType,
  open,
  onOpenChange,
}: {
  attackType: AttackType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const explanation = getAttackExplanation(attackType);
  if (!explanation) {
    return null;
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-lg sm:max-w-lg">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>Explain this attack</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Attack type:</strong>{" "}
                {explanation.title}
              </p>
              <p>
                <strong className="text-foreground">What it is:</strong>{" "}
                {explanation.whatItIs}
              </p>
              <p>
                <strong className="text-red-400">Vulnerable Mode:</strong>{" "}
                {explanation.whyVulnerable}
              </p>
              <p>
                <strong className="text-emerald-400">Secure Mode:</strong>{" "}
                {explanation.whyBlocked}
              </p>
              <p>
                <strong className="text-foreground">What changed:</strong>{" "}
                {explanation.whatChanged}
              </p>
              <p className="text-xs text-muted-foreground/80">
                {explanation.owasp}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function HowItWorksModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-lg sm:max-w-lg">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle>How it works</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                <strong className="text-red-400">Vulnerable Mode</strong> changes
                the system prompt to a deliberately weak configuration and removes
                the security filter. Prompts are sent directly to the local Ollama
                LLM.
              </p>
              <p>
                <strong className="text-emerald-400">Secure Mode</strong> uses a
                defensive system prompt and blocks malicious inputs before the LLM
                sees them.
              </p>
              <p>
                If suspicious patterns are found in Secure Mode, the request is
                blocked and Ollama is never called.
              </p>
              <p>
                Safe prompts in Secure Mode still reach Ollama with the hardened
                system prompt.
              </p>
              <p>
                This demonstrates why applications using LLMs need an input
                security layer (OWASP LLM01: Prompt Injection).
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ModeSelector({
  mode,
  disabled,
  onModeChange,
}: {
  mode: SecurityMode;
  disabled?: boolean;
  onModeChange: (mode: SecurityMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Security Mode
      </span>
      <div className="flex gap-2">
        <Button
          className={cn(
            "min-w-[140px] border-2 font-semibold",
            mode === "vulnerable"
              ? "border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "border-red-500/30 bg-transparent text-red-400/60 hover:bg-red-500/10"
          )}
          disabled={disabled}
          onClick={() => onModeChange("vulnerable")}
          size="sm"
          type="button"
          variant="outline"
        >
          <ShieldOffIcon className="size-4" />
          Vulnerable Mode
        </Button>
        <Button
          className={cn(
            "min-w-[140px] border-2 font-semibold",
            mode === "secure"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "border-emerald-500/30 bg-transparent text-emerald-400/60 hover:bg-emerald-500/10"
          )}
          disabled={disabled}
          onClick={() => onModeChange("secure")}
          size="sm"
          type="button"
          variant="outline"
        >
          <ShieldCheckIcon className="size-4" />
          Secure Mode
        </Button>
      </div>
      {mode === "vulnerable" ? (
        <Badge className="border-red-500/40 bg-red-500/10 text-red-400" variant="outline">
          Active: Vulnerable
        </Badge>
      ) : (
        <Badge
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          variant="outline"
        >
          Active: Secure
        </Badge>
      )}
    </div>
  );
}

function AttackListPanel({
  disabled,
  selectedId,
  onSelect,
}: {
  disabled?: boolean;
  selectedId: AttackType | null;
  onSelect: (id: AttackType, prompt: string) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Choose an attack
      </h2>
      <ul className="flex flex-col gap-2">
        {ATTACK_PRESETS.map((preset) => (
          <li key={preset.id}>
            <button
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50",
                selectedId === preset.id
                  ? preset.id === "none"
                    ? "border-border/80 bg-muted/40"
                    : "border-primary/50 bg-primary/10"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
              )}
              disabled={disabled}
              onClick={() => onSelect(preset.id, preset.prompt)}
              type="button"
            >
              <span className="block text-sm font-medium text-foreground">
                {preset.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selectedId && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {ATTACK_PRESETS.find((p) => p.id === selectedId)?.description}
        </p>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: DemoRunResult }) {
  const statusKind = getStatusKind(result);

  if (result.blocked) {
    return (
      <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ShieldCheckIcon className="size-5 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-wide text-emerald-400 uppercase">
            Attack Blocked: Secure Mode
          </h3>
        </div>
        <p className="text-sm whitespace-pre-wrap text-foreground/90">
          {result.llmResponse}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300" variant="outline">
            Blocked
          </Badge>
        </div>
      </div>
    );
  }

  const isAttack = result.analysis.classification === "attack";
  const isVulnerable = result.securityMode === "vulnerable";
  const compromised = statusKind === "attack-success";

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4",
        compromised
          ? "border-red-500/40 bg-red-500/10"
          : isVulnerable && isAttack
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-border/60 bg-muted/20"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {compromised ? (
          <>
            <ShieldAlertIcon className="size-5 text-red-400" />
            <h3 className="text-sm font-bold tracking-wide text-red-400 uppercase">
              LLM Response: Vulnerable Mode
            </h3>
          </>
        ) : isVulnerable && isAttack ? (
          <>
            <ShieldAlertIcon className="size-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-wide text-amber-400 uppercase">
              LLM Response: Vulnerable Mode
            </h3>
          </>
        ) : (
          <>
            <ShieldCheckIcon className="size-5 text-foreground" />
            <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
              LLM Response: {formatMode(result.securityMode)}
            </h3>
          </>
        )}
      </div>
      <div className="max-h-[480px] overflow-y-auto rounded-lg bg-background/50 p-3">
        <p className="text-sm whitespace-pre-wrap text-foreground/90">
          {result.llmResponse}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isVulnerable && isAttack && (
          <Badge
            className={cn(
              compromised
                ? "border-red-500/40 bg-red-500/20 text-red-300"
                : "border-amber-500/40 bg-amber-500/20 text-amber-300"
            )}
            variant="outline"
          >
            Allowed
          </Badge>
        )}
        {result.isMockFallback ? (
          <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-400" variant="outline">
            Fallback mock response
          </Badge>
        ) : (
          <Badge className="border-blue-500/40 bg-blue-500/10 text-blue-400" variant="outline">
            Real LLM response
          </Badge>
        )}
      </div>
    </div>
  );
}

function AnalysisCard({ result }: { result: DemoRunResult }) {
  const { analysis } = result;
  const isAttack = analysis.classification === "attack";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Analysis</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Classification</dt>
          <dd className="font-medium uppercase text-foreground">
            {analysis.classification}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Selected preset</dt>
          <dd className="font-medium text-foreground">
            {getPresetLabel(result.attackType)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="font-medium text-foreground">
            {formatMode(result.securityMode)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Attack detected</dt>
          <dd className="font-medium text-foreground">
            {isAttack ? "Yes" : "No"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Attack type</dt>
          <dd className="font-medium text-foreground">
            {getPresetLabel(result.analysis.attack_type)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Risk level</dt>
          <dd className="font-medium capitalize text-foreground">
            {analysis.risk_level}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">OWASP category</dt>
          <dd className="font-medium text-foreground">
            {getOwaspCategory(analysis.attack_type)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:col-span-2 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Matched patterns</dt>
          <dd className="font-medium text-foreground">
            {analysis.matched_patterns.length > 0
              ? analysis.matched_patterns.join(", ")
              : "n/a"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Decision</dt>
          <dd className="font-medium text-foreground">
            {result.blocked
              ? "Blocked in Secure Mode"
              : isAttack
                ? result.securityMode === "vulnerable"
                  ? "Allowed in Vulnerable Mode"
                  : "Allowed"
                : "Safe, sent to LLM normally"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Ollama called</dt>
          <dd className="font-medium text-foreground">
            {result.ollamaCalled ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ModeComparison({ onShowChanges }: { onShowChanges: () => void }) {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          What changes between modes?
        </h2>
        <Button onClick={onShowChanges} size="xs" type="button" variant="ghost">
          Show changes
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm">
          <span className="font-medium text-red-400">Vulnerable Mode: </span>
          <span className="text-muted-foreground">
            User Prompt → LLM → Possible compromised response
          </span>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm">
          <span className="font-medium text-emerald-400">Secure Mode: </span>
          <span className="text-muted-foreground">
            User Prompt → Security Engine → LLM or Blocked → Safe behavior
          </span>
        </div>
      </div>
    </section>
  );
}

export function SecurityDemoApp() {
  const [securityMode, setSecurityMode] = useState<SecurityMode>("vulnerable");
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<DemoRunResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAttack = useCallback(
    async (mode: SecurityMode, attackType: AttackType | null, text: string) => {
      if (!text.trim()) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDemoResult(text, mode, attackType);
        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to reach the demo API. Is Ollama running?"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleModeChange = useCallback(
    (mode: SecurityMode) => {
      setSecurityMode(mode);
      if (prompt.trim() && result) {
        runAttack(mode, selectedAttack, prompt);
      }
    },
    [prompt, result, runAttack, selectedAttack]
  );

  const handleSelectAttack = useCallback((id: AttackType, attackPrompt: string) => {
    setSelectedAttack(id);
    setPrompt(attackPrompt);
    setResult(null);
    setError(null);
  }, []);

  const handleRunAttack = useCallback(() => {
    runAttack(securityMode, selectedAttack, prompt);
  }, [prompt, runAttack, securityMode, selectedAttack]);

  const handleClear = useCallback(() => {
    setPrompt("");
    setSelectedAttack(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Security Demo
            </h1>
            <p className="text-sm text-muted-foreground">
              Prompt Injection Attack &amp; Defense
            </p>
          </div>
          <Button
            className="shrink-0"
            onClick={() => setShowModal(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <HelpCircleIcon className="size-4" />
            How it works?
          </Button>
        </header>

        <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
          <ModeSelector
            disabled={isLoading}
            mode={securityMode}
            onModeChange={handleModeChange}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AttackListPanel
            disabled={isLoading}
            onSelect={handleSelectAttack}
            selectedId={selectedAttack}
          />

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Step 1: Your prompt
              </h2>
              <Textarea
                className="min-h-[100px] font-mono text-sm"
                disabled={isLoading}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Select an attack or type your own prompt..."
                value={prompt}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className={cn(
                    securityMode === "vulnerable"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                  disabled={!prompt.trim() || isLoading}
                  onClick={handleRunAttack}
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Running…
                    </>
                  ) : (
                    "Run Attack"
                  )}
                </Button>
                <Button
                  disabled={isLoading}
                  onClick={handleClear}
                  type="button"
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Step 2: Result
                </h2>
                {result &&
                  result.analysis.classification === "attack" &&
                  getAttackExplanation(result.analysis.attack_type) && (
                    <Button
                      onClick={() => setShowExplainModal(true)}
                      size="xs"
                      type="button"
                      variant="outline"
                    >
                      <InfoIcon className="size-3.5" />
                      Explain this attack
                    </Button>
                  )}
              </div>
              {isLoading && !result && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Waiting for Ollama response…
                </div>
              )}
              {result && (
                <>
                  <AttackStatusBanner result={result} />
                  <ResultCard result={result} />
                </>
              )}
              {!isLoading && !result && (
                <p className="text-sm text-muted-foreground">
                  Run an attack to see the real LLM response for the current mode.
                </p>
              )}
            </div>

            {result && <AnalysisCard result={result} />}
          </div>
        </div>

        <ModeComparison onShowChanges={() => setShowModal(true)} />
      </div>

      <HowItWorksModal onOpenChange={setShowModal} open={showModal} />
      {result &&
        result.analysis.classification === "attack" &&
        getAttackExplanation(result.analysis.attack_type) && (
          <ExplainAttackModal
            attackType={result.analysis.attack_type}
            onOpenChange={setShowExplainModal}
            open={showExplainModal}
          />
        )}
    </div>
  );
}

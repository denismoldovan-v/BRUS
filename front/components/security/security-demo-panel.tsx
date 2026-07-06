"use client";

import type {
  SecurityAnalysisResult,
  SecurityMode,
} from "@/lib/security/types";
import { AttackPresets } from "./attack-presets";
import { DemoControls } from "./demo-controls";
import { SecurityAnalysisPanel } from "./security-analysis-panel";
import { SecurityModeIndicator } from "./security-mode-indicator";

export function SecurityDemoPanel({
  securityMode,
  onModeChange,
  onSelectPreset,
  onDemoAttack,
  onDemoDefense,
  lastAnalysis,
  disabled,
}: {
  securityMode: SecurityMode;
  onModeChange: (mode: SecurityMode) => void;
  onSelectPreset: (prompt: string) => void;
  onDemoAttack: () => void;
  onDemoDefense: () => void;
  lastAnalysis: SecurityAnalysisResult | null;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SecurityModeIndicator mode={securityMode} onModeChange={onModeChange} />
        <p className="text-[11px] text-muted-foreground/70">
          AI Security Demo: Prompt Injection Attack &amp; Defense
        </p>
      </div>

      <DemoControls
        disabled={disabled}
        onDemoAttack={onDemoAttack}
        onDemoDefense={onDemoDefense}
      />

      <AttackPresets disabled={disabled} onSelectPreset={onSelectPreset} />

      <SecurityAnalysisPanel analysis={lastAnalysis} />
    </div>
  );
}

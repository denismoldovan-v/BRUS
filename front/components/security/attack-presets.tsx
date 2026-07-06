"use client";

import {
  AlertTriangleIcon,
  BugIcon,
  KeyIcon,
  ShieldOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATTACK_PRESETS } from "@/lib/security/presets";
import type { AttackType } from "@/lib/security/types";
import { cn } from "@/lib/utils";

const PRESET_ICONS: Record<Exclude<AttackType, "none">, typeof BugIcon> = {
  prompt_injection: BugIcon,
  prompt_leakage: KeyIcon,
  jailbreak: ShieldOffIcon,
  instruction_override: AlertTriangleIcon,
};

export function AttackPresets({
  onSelectPreset,
  disabled,
}: {
  onSelectPreset: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4"
      data-testid="attack-presets"
    >
      {ATTACK_PRESETS.map((preset) => {
        const Icon = PRESET_ICONS[preset.id];
        return (
          <Button
            className={cn(
              "h-auto min-h-[52px] flex-col items-start gap-1 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-left transition-all",
              "hover:-translate-y-0.5 hover:border-border hover:bg-card/80 hover:shadow-[var(--shadow-card)]",
              "active:scale-[0.98]"
            )}
            disabled={disabled}
            key={preset.id}
            onClick={() => onSelectPreset(preset.prompt)}
            type="button"
            variant="outline"
          >
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <Icon className="size-3.5 shrink-0 opacity-70" />
              {preset.label}
            </span>
            <span className="line-clamp-1 text-[10px] leading-snug text-muted-foreground">
              {preset.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

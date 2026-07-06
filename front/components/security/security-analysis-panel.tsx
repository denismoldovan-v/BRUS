"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SecurityAnalysisResult } from "@/lib/security/types";
import { cn } from "@/lib/utils";

const RISK_COLORS: Record<
  SecurityAnalysisResult["risk_level"],
  string
> = {
  none: "border-border/50 bg-muted/30 text-muted-foreground",
  low: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  medium:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

export function SecurityAnalysisPanel({
  analysis,
}: {
  analysis: SecurityAnalysisResult | null;
}) {
  if (!analysis || analysis.attack_type === "none") {
    return null;
  }

  const attackLabel = analysis.attack_type.replace(/_/g, " ");

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-[12px] leading-relaxed",
        analysis.blocked
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}
      data-testid="security-analysis-panel"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {analysis.blocked ? (
          <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ShieldAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        )}
        <span className="font-semibold text-foreground">
          Security Analysis
        </span>
        <Badge
          className={cn("text-[10px] uppercase", RISK_COLORS[analysis.risk_level])}
          variant="outline"
        >
          {analysis.risk_level} risk
        </Badge>
        <Badge className="text-[10px] capitalize" variant="secondary">
          {attackLabel}
        </Badge>
        {analysis.blocked ? (
          <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400" variant="outline">
            <CheckCircle2Icon className="size-3" />
            Blocked
          </Badge>
        ) : (
          <Badge className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400" variant="outline">
            <AlertTriangleIcon className="size-3" />
            Allowed
          </Badge>
        )}
      </div>

      <p className="mb-2 text-muted-foreground">{analysis.explanation}</p>

      {analysis.matched_patterns.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Matched:
          </span>
          {analysis.matched_patterns.map((pattern) => (
            <code
              className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
              key={pattern}
            >
              {pattern}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

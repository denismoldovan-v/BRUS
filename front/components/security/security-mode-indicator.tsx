"use client";

import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SecurityMode } from "@/lib/security/types";
import { cn } from "@/lib/utils";

/**
 * Always-visible security mode indicator and toggle.
 *
 * Vulnerable Mode simulates an unprotected application (no input filtering).
 * Secure Mode enables the input security engine with blocking.
 */
export function SecurityModeIndicator({
  mode,
  onModeChange,
}: {
  mode: SecurityMode;
  onModeChange: (mode: SecurityMode) => void;
}) {
  const isSecure = mode === "secure";

  return (
    <div
      className="flex items-center gap-2"
      data-testid="security-mode-indicator"
    >
      <Badge
        className={cn(
          "gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
          isSecure
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
        )}
        variant="outline"
      >
        {isSecure ? (
          <ShieldCheckIcon className="size-3" />
        ) : (
          <ShieldAlertIcon className="size-3" />
        )}
        {isSecure ? "Secure Mode" : "Vulnerable Mode"}
      </Badge>

      <div className="hidden items-center rounded-lg border border-border/40 bg-muted/30 p-0.5 sm:flex">
        <Button
          className={cn(
            "h-7 rounded-md px-2.5 text-[11px]",
            !isSecure && "bg-background shadow-sm"
          )}
          onClick={() => onModeChange("vulnerable")}
          size="sm"
          type="button"
          variant="ghost"
        >
          Vulnerable
        </Button>
        <Button
          className={cn(
            "h-7 rounded-md px-2.5 text-[11px]",
            isSecure && "bg-background shadow-sm"
          )}
          onClick={() => onModeChange("secure")}
          size="sm"
          type="button"
          variant="ghost"
        >
          Secure
        </Button>
      </div>
    </div>
  );
}

"use client";

import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoControls({
  onDemoAttack,
  onDemoDefense,
  disabled,
}: {
  onDemoAttack: () => void;
  onDemoDefense: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex w-full flex-col gap-2 sm:flex-row"
      data-testid="demo-controls"
    >
      <Button
        className={cn(
          "h-11 flex-1 gap-2 rounded-xl border-red-500/30 bg-red-500/10 text-red-700",
          "hover:bg-red-500/20 hover:text-red-800",
          "dark:text-red-400 dark:hover:text-red-300"
        )}
        disabled={disabled}
        onClick={onDemoAttack}
        type="button"
        variant="outline"
      >
        <ShieldAlertIcon className="size-4" />
        <span className="font-semibold">DEMO ATTACK</span>
      </Button>

      <Button
        className={cn(
          "h-11 flex-1 gap-2 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
          "hover:bg-emerald-500/20 hover:text-emerald-800",
          "dark:text-emerald-400 dark:hover:text-emerald-300"
        )}
        disabled={disabled}
        onClick={onDemoDefense}
        type="button"
        variant="outline"
      >
        <ShieldCheckIcon className="size-4" />
        <span className="font-semibold">DEMO DEFENSE</span>
      </Button>
    </div>
  );
}

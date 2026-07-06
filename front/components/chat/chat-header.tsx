"use client";

import { PanelLeftIcon, ShieldIcon } from "lucide-react";
import { memo } from "react";
import { SecurityModeIndicator } from "@/components/security/security-mode-indicator";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { SecurityMode } from "@/lib/security/types";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  securityMode,
  onSecurityModeChange,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  securityMode: SecurityMode;
  onSecurityModeChange: (mode: SecurityMode) => void;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/30 bg-sidebar px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/5">
          <ShieldIcon className="size-4 text-foreground/70" />
        </div>
        <div className="hidden flex-col sm:flex">
          <span className="text-[13px] font-semibold leading-tight text-foreground">
            AI Security Demo
          </span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            Prompt Injection Attack &amp; Defense
          </span>
        </div>
      </div>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <div className="ml-auto">
        <SecurityModeIndicator
          mode={securityMode}
          onModeChange={onSecurityModeChange}
        />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.securityMode === nextProps.securityMode
  );
});

import { Toaster } from "sonner";
import { ChatShell } from "@/components/chat/shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          className:
            "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
        }}
      />
      <ChatShell />
      {children}
    </>
  );
}

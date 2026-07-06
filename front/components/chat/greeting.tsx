import { motion } from "framer-motion";
import { ShieldAlertIcon } from "lucide-react";

export const Greeting = () => {
  return (
    <div className="flex flex-col items-center px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-foreground/5"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <ShieldAlertIcon className="size-6 text-foreground/60" />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        AI Security Demo
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-center text-muted-foreground/80 text-sm font-medium"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.42, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Prompt Injection Attack and Defense for LLMs
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 max-w-md text-center text-muted-foreground/60 text-[13px] leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Use the attack presets below or click{" "}
        <strong className="font-semibold text-foreground/70">DEMO ATTACK</strong>{" "}
        to see an unprotected model comply, then{" "}
        <strong className="font-semibold text-foreground/70">DEMO DEFENSE</strong>{" "}
        to see the same attack blocked.
      </motion.div>
    </div>
  );
};

"use client";

import { useSyncExternalStore } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LazyBlurText } from "@/components/react-bits/lazy";
import { prefersReducedMotion } from "@/components/react-bits/rpg-theme";

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
};

function useReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    prefersReducedMotion,
    () => false,
  );
}

export function RPGEmptyState({ icon: Icon, title, subtitle, className }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("rpg-empty-state", className)}>
      <div className="rpg-empty-state-icon">
        <Icon className="size-8 text-rpg-gold" strokeWidth={1.5} />
      </div>
      {reducedMotion ? (
        <p className="mt-4 font-heading text-lg text-rpg-gold">{title}</p>
      ) : (
        <LazyBlurText
          text={title}
          delay={60}
          stepDuration={0.25}
          className="mt-4 font-heading text-lg text-rpg-gold"
        />
      )}
      {subtitle ? <p className="mt-2 max-w-sm text-sm text-rpg-muted">{subtitle}</p> : null}
    </div>
  );
}

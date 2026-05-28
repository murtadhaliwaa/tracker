"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import BlurText from "@/components/BlurText";
import { prefersReducedMotion } from "@/components/react-bits/rpg-theme";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
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

export function RPGPageHeader({ title, subtitle, action, className }: Props) {
  const reducedMotion = useReducedMotion();
  const titleIsString = typeof title === "string";

  return (
    <div className={cn("mb-8 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="rpg-header-accent relative h-0.5 w-14 bg-[rgba(212,175,55,0.35)]">
            <span className="absolute -right-2 top-1/2 size-3.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-rpg-gold shadow-[0_0_18px_rgba(212,175,55,0.35)]" />
          </div>
          {titleIsString && !reducedMotion ? (
            <h1 className="rpg-page-title text-rpg-gold">
              <BlurText
                text={title}
                delay={80}
                stepDuration={0.3}
              />
            </h1>
          ) : (
            <h1 className="rpg-page-title text-rpg-gold">{title}</h1>
          )}
        </div>
        {subtitle ? <p className="rpg-page-subtitle text-rpg-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

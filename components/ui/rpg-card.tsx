import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RpgGlow = "gold" | "purple" | "teal" | "blue" | "red" | "none";

type Props = {
  glow?: RpgGlow;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const glowToClasses: Record<RpgGlow, string> = {
  gold: "hover:border-rpg-gold/40 hover:shadow-rpgGold",
  purple: "hover:border-rpg-purple/40 hover:shadow-rpgPurple",
  teal: "hover:border-cyan-500/40 hover:shadow-[0_0_24px_rgba(6,182,212,0.2)]",
  blue: "hover:border-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]",
  red: "hover:border-red-500/40 hover:shadow-[0_0_24px_rgba(239,68,68,0.2)]",
  none: "",
};

export function RPGCard({ glow = "none", className, children, ...props }: Props) {
  return (
    <div
      {...props}
      className={cn(
        "relative rounded-xl border border-rpg-border bg-rpg-surface p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] rpg-card-lift",
        glowToClasses[glow],
        className,
      )}
    >
      {children}
    </div>
  );
}

"use client";

import {
  Crown,
  Flame,
  Gem,
  Hammer,
  Pickaxe,
  ScrollText,
  Shield,
  Skull,
  Star,
  Sword,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAvatarBackground,
  getPlayerInitials,
  parseAvatarStyle,
  type AvatarIconId,
} from "@/lib/player-profile";

function SpearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3v14M12 17l-2.5 4M12 17l2.5 4M9 7h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON_MAP: Record<Exclude<AvatarIconId, "initials" | "spear">, LucideIcon> = {
  sword: Sword,
  shield: Shield,
  crown: Crown,
  flame: Flame,
  skull: Skull,
  wand: Wand2,
  gem: Gem,
  star: Star,
  scroll: ScrollText,
  axe: Pickaxe,
  hammer: Hammer,
  zap: Zap,
};

type Props = {
  name?: string | null;
  avatarStyle?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  ring?: boolean;
};

const sizeClasses = {
  sm: "size-10 text-sm [&_svg]:size-4",
  md: "size-20 text-xl [&_svg]:size-8",
  lg: "size-24 text-2xl [&_svg]:size-10",
};

export function PlayerAvatar({ name, avatarStyle, size = "md", className, ring = false }: Props) {
  const initials = getPlayerInitials(name);
  const background = getAvatarBackground(avatarStyle);
  const { iconId } = parseAvatarStyle(avatarStyle);

  const IconComponent =
    iconId === "spear"
      ? SpearIcon
      : iconId !== "initials"
        ? ICON_MAP[iconId as keyof typeof ICON_MAP]
        : null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-[#0a0a0f]",
        sizeClasses[size],
        ring && "rpg-avatar-ring",
        className,
      )}
      style={{ background }}
    >
      {IconComponent ? <IconComponent className="shrink-0" /> : initials}
    </div>
  );
}

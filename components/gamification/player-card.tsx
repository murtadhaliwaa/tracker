"use client";

import { cn } from "@/lib/utils";
import { getAvatarBackground, getPlayerDisplayName, getPlayerInitials } from "@/lib/player-profile";

type XpProgressBarProps = {
  currentXP: number;
  maxXP: number;
  className?: string;
};

export function XpProgressBar({ currentXP, maxXP, className }: XpProgressBarProps) {
  const safeMax = maxXP > 0 ? maxXP : 1;
  const fillPercent = Math.max((currentXP / safeMax) * 100, 1.5);

  return (
    <div className={cn("w-full", className)}>
      <div className="rpg-progress-track">
        <div className="rpg-xp-fill h-full rounded-full" style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
}

type PlayerCardProps = {
  playerName: string | null;
  playerTitle: string;
  playerLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  avatarStyle?: string | null;
  isRtl?: boolean;
  nameFallback?: string;
};

export function PlayerCard({
  playerName,
  playerTitle,
  playerLevel,
  currentXP,
  xpToNextLevel,
  avatarStyle,
  isRtl = false,
  nameFallback = "Player",
}: PlayerCardProps) {
  const displayName = getPlayerDisplayName(playerName, nameFallback);
  const initials = getPlayerInitials(playerName);
  const avatarBackground = getAvatarBackground(avatarStyle);
  const fillPercent = Math.max(
    (currentXP / (xpToNextLevel > 0 ? xpToNextLevel : 1)) * 100,
    1.5,
  );

  return (
    <div className="mx-3 mb-4 flex w-[calc(100%-24px)] flex-col gap-2 rounded-xl border border-rpg-border bg-rpg-surface p-3">
      <div
        className={cn("flex items-center gap-2.5", isRtl && "flex-row-reverse")}
      >
        <div
          className="rpg-avatar-ring flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0a0a0f]"
          style={{ background: avatarBackground }}
        >
          {initials}
        </div>

        <div className={cn("min-w-0 flex-1 overflow-hidden", isRtl && "text-right")}>
          <p className="truncate text-[13px] font-semibold text-rpg-text">{displayName}</p>
          <p className="truncate text-[11px] text-rpg-muted">{playerTitle}</p>
        </div>

        <div className="rpg-level-badge shrink-0 rounded-md px-2 py-0.5 text-[11px]">
          LVL {playerLevel}
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-1">
        <div className="rpg-progress-track mt-1">
          <div
            className="rpg-xp-fill h-full rounded-full"
            style={{
              width: `${fillPercent}%`,
              ...(isRtl ? { marginInlineStart: "auto" } : {}),
            }}
          />
        </div>
        <span className="text-[10px] text-rpg-muted">
          {currentXP} / {xpToNextLevel} XP
        </span>
      </div>
    </div>
  );
}

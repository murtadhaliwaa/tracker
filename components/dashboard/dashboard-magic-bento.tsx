"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import MagicBento, { type BentoCardProps } from "@/components/MagicBento";
import { XpProgressBar } from "@/components/gamification/player-card";

const SURFACE = "#1a1a2e";

type Props = {
  streak: number;
  freezesAvailable: number;
  healthValue: number;
  maxHealth: number;
  level: number;
  profileTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  dailyCompleted: number;
  dailyTotal: number;
  isPerfectDay: boolean;
  bossTitle: string;
  bossCurrent: number;
  bossTarget: number;
  onStreakClick?: () => void;
  onHealthClick?: () => void;
};

export function DashboardMagicBento({
  streak,
  freezesAvailable,
  healthValue,
  maxHealth,
  level,
  profileTitle,
  currentXP,
  xpToNextLevel,
  dailyCompleted,
  dailyTotal,
  isPerfectDay,
  bossTitle,
  bossCurrent,
  bossTarget,
  onStreakClick,
  onHealthClick,
}: Props) {
  const t = useTranslations("dashboard");

  const cards = useMemo<BentoCardProps[]>(
    () => [
      {
        color: SURFACE,
        label: t("streak"),
        title: String(streak),
        description: `${t("dayStreak")} · ${t("freezesAvailable", { count: freezesAvailable })}`,
        media: (
          <Image
            src="/images/streak-fire.png"
            alt=""
            width={52}
            height={52}
            className="size-[52px] object-contain drop-shadow-[0_0_14px_rgba(255,120,40,0.5)]"
            aria-hidden
          />
        ),
      },
      {
        color: SURFACE,
        label: t("health"),
        title: `${healthValue}/${maxHealth}`,
        description:
          healthValue === 0 ? t("wounded") : `${healthValue} ${t("health").toLowerCase()} hearts remaining`,
        media: (
          <Image
            src="/images/health-heart.svg"
            alt=""
            width={52}
            height={52}
            className="size-[52px] object-contain drop-shadow-[0_0_14px_rgba(239,68,68,0.5)]"
            aria-hidden
          />
        ),
      },
      {
        color: SURFACE,
        label: t("level"),
        title: `LVL ${level}`,
        description: profileTitle,
        footer: (
          <div className="mt-auto w-full">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-rpg-muted">
              <span className="font-semibold uppercase tracking-wide text-rpg-gold/90">
                Level {level}
              </span>
              <span>
                {currentXP} / {xpToNextLevel} XP
              </span>
            </div>
            <XpProgressBar currentXP={currentXP} maxXP={xpToNextLevel} />
          </div>
        ),
      },
      {
        color: SURFACE,
        label: t("dailyHabits"),
        title: dailyTotal ? `${dailyCompleted}/${dailyTotal}` : "0",
        description: isPerfectDay ? t("perfectDay") : t("totalCount", { count: dailyTotal }),
      },
      {
        color: SURFACE,
        label: t("weeklyBoss"),
        title: bossTitle,
        description: `${bossCurrent} / ${bossTarget}`,
      },
      {
        color: SURFACE,
        label: "XP",
        title: String(currentXP),
        description: `${currentXP} / ${xpToNextLevel} to next level`,
      },
    ],
    [
      t,
      streak,
      freezesAvailable,
      healthValue,
      maxHealth,
      level,
      profileTitle,
      currentXP,
      xpToNextLevel,
      dailyCompleted,
      dailyTotal,
      isPerfectDay,
      bossTitle,
      bossCurrent,
      bossTarget,
    ],
  );

  return (
    <MagicBento
      cards={cards}
      textAutoHide={true}
      enableStars={true}
      enableSpotlight={true}
      enableBorderGlow={true}
      enableTilt={true}
      enableMagnetism={true}
      clickEffect={true}
      spotlightRadius={300}
      particleCount={10}
      glowColor="124, 58, 237"
      onCardClick={(index) => {
        if (index === 0) onStreakClick?.();
        if (index === 1) onHealthClick?.();
      }}
    />
  );
}

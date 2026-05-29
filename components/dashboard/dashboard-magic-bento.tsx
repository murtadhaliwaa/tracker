"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BentoCardProps } from "@/components/MagicBento";
import { XpProgressBar } from "@/components/gamification/player-card";
import { Button } from "@/components/ui/button";

const MagicBento = dynamic(() => import("@/components/MagicBento"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] min-h-[160px] animate-pulse rounded-xl bg-[#1a1a2e]/70" />
      ))}
    </div>
  ),
});

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
  onUseFreeze?: () => void;
  onRecoveryQuest?: () => void;
  freezeDisabled?: boolean;
  recoveryDisabled?: boolean;
  showRecoveryQuest?: boolean;
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
  onUseFreeze,
  onRecoveryQuest,
  freezeDisabled = false,
  recoveryDisabled = false,
  showRecoveryQuest = false,
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
        footer: (
          <div className="mt-auto w-full pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full border-rpg-border bg-rpg-surface text-xs hover:bg-rpg-gold/10 hover:text-rpg-gold"
              disabled={freezeDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onUseFreeze?.();
              }}
            >
              {freezesAvailable <= 0 ? t("noFreezesRemaining") : t("useFreeze")}
            </Button>
          </div>
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
        footer: showRecoveryQuest ? (
          <div className="mt-auto w-full pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full border-rpg-border bg-rpg-surface text-xs hover:bg-rpg-gold/10 hover:text-rpg-gold"
              disabled={recoveryDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onRecoveryQuest?.();
              }}
            >
              {t("recoveryQuest")}
            </Button>
          </div>
        ) : undefined,
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
        titleClamp: 2,
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
      onUseFreeze,
      onRecoveryQuest,
      freezeDisabled,
      recoveryDisabled,
      showRecoveryQuest,
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
    />
  );
}

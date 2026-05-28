"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShinyText from "@/components/ShinyText";
import { RPG_SHINY_GOLD } from "@/components/react-bits/rpg-theme";

type Props = {
  onDismiss: () => void;
};

export function PerfectDayCelebrationBanner({ onDismiss }: Props) {
  const t = useTranslations("dashboard");

  return (
    <div className="perfect-day-banner relative mb-5 flex w-full items-center gap-4 rounded-xl px-5 py-4">
      <p className="min-w-0 flex-1 font-cinzel text-lg font-bold">
        <ShinyText
          text={t("perfectDayBannerText")}
          color={RPG_SHINY_GOLD.color}
          shineColor={RPG_SHINY_GOLD.shineColor}
          speed={RPG_SHINY_GOLD.speed}
          spread={RPG_SHINY_GOLD.spread}
          yoyo
        />
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative z-10 shrink-0 text-rpg-muted hover:text-rpg-gold"
        onClick={onDismiss}
        aria-label={t("perfectDayDismiss")}
      >
        <X className="size-5" />
      </Button>
    </div>
  );
}

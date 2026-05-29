"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/BorderGlow";
import ShinyText from "@/components/ShinyText";
import { RPG_BORDER_GLOW, RPG_SHINY_GOLD } from "@/components/react-bits/rpg-theme";
import { translateLevelTitle } from "@/lib/level-display";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
  title: string;
};

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  delay: `${(i * 0.35) % 3}s`,
  duration: `${2.5 + (i % 5) * 0.4}s`,
}));

export function LevelUpModal({ open, onOpenChange, level, title }: Props) {
  const t = useTranslations("common");
  const tTitles = useTranslations("common.levelTitles");
  const displayTitle = translateLevelTitle(tTitles, title);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onOpenChange(false), 8000);
    return () => clearTimeout(timer);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="level-up-particles pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="level-up-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <BorderGlow
        animated
        className="relative z-10 mx-4 w-full max-w-[420px]"
        backgroundColor={RPG_BORDER_GLOW.surface}
        borderRadius={16}
        colors={[...RPG_BORDER_GLOW.goldColors]}
        glowColor={RPG_BORDER_GLOW.goldGlowHsl}
        glowIntensity={1.2}
      >
        <div className="level-up-card p-12 text-center">
          <Shield className="mx-auto size-16 text-rpg-gold" strokeWidth={1.5} />
          <p className="level-up-heading mt-6 font-cinzel text-[40px] font-bold">
            <ShinyText
              text={t("levelUpHeading")}
              color={RPG_SHINY_GOLD.color}
              shineColor={RPG_SHINY_GOLD.shineColor}
              speed={2.5}
              spread={RPG_SHINY_GOLD.spread}
              yoyo
            />
          </p>
          <p className="mt-2 font-cinzel text-[56px] font-bold text-rpg-text">{t("levelUpLevel", { level })}</p>
          <p className="mt-2 text-[20px] text-rpg-muted">{displayTitle}</p>
          <div className="mx-auto my-6 h-px w-24 bg-[rgba(212,175,55,0.3)]" />
          <p className="text-base italic text-rpg-muted">{t("levelUpMessage")}</p>
          <Button
            className="mt-8 px-10 py-3 font-cinzel text-base font-bold"
            onClick={() => onOpenChange(false)}
          >
            {t("continue")}
          </Button>
        </div>
      </BorderGlow>
    </div>
  );
}

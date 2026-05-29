"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { habitIconDisplay } from "@/lib/habit-display";
import { getOnboardingPresetLabel, type OnboardingPresetKey } from "@/lib/onboarding-display";
import { XpProgressBar } from "@/components/gamification/player-card";
import {
  ONBOARDING_HABIT_PRESETS,
  addOnboardingHabits,
  completeOnboarding,
  saveOnboardingName,
} from "@/app/[locale]/(protected)/onboarding/actions";

type Props = {
  open: boolean;
};

export function OnboardingModal({ open }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const toggleHabit = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const closeAndRefresh = () => {
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-lg"
      >
        {step === 1 ? (
          <div className="space-y-6 py-2 text-center">
            <h2 className="font-cinzel text-3xl font-bold text-[#f0c040]">{t("welcomeTitle")}</h2>
            <p className="text-sm text-[#8888aa]">{t("welcomeSubtitle")}</p>
            <Button
              className="w-full bg-[#f0c040] text-[#0a0a0f] hover:bg-[#e0b030]"
              onClick={() => setStep(2)}
            >
              {t("getStarted")}
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5 py-2">
            <h2 className="font-cinzel text-2xl font-bold text-[#e8e8f0]">{t("nameTitle")}</h2>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="border-[#1e1e3a] bg-[#13131f]"
            />
            <Button
              className="w-full bg-[#f0c040] text-[#0a0a0f] hover:bg-[#e0b030]"
              disabled={pending || !name.trim()}
              onClick={() =>
                startTransition(async () => {
                  await saveOnboardingName({ name: name.trim() });
                  setStep(3);
                })
              }
            >
              {t("continue")}
            </Button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5 py-2">
            <div>
              <h2 className="font-cinzel text-2xl font-bold text-[#e8e8f0]">{t("habitsTitle")}</h2>
              <p className="mt-1 text-xs text-[#8888aa]">{t("habitsHint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ONBOARDING_HABIT_PRESETS.map((preset) => {
                const active = selected.includes(preset.key);
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => toggleHabit(preset.key)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      active
                        ? "border-[#f0c040] bg-[#f0c040]/10 shadow-[0_0_16px_rgba(240,192,64,0.15)]"
                        : "border-[#1e1e3a] bg-[#13131f] hover:border-[#2a2a4a]",
                    )}
                  >
                    <span className="text-lg">{habitIconDisplay(preset.icon)}</span>
                    <p className="mt-2 text-sm font-medium text-[#e8e8f0]">
                      {getOnboardingPresetLabel(t, preset.key)}
                    </p>
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full bg-[#f0c040] text-[#0a0a0f] hover:bg-[#e0b030]"
              disabled={pending || selected.length === 0}
              onClick={() =>
                startTransition(async () => {
                  await addOnboardingHabits(
                    selected.map((key) => ({
                      key,
                      title: getOnboardingPresetLabel(t, key as OnboardingPresetKey),
                    })),
                  );
                  setStep(4);
                })
              }
            >
              {t("addSelectedHabits")}
            </Button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6 py-2 text-center">
            <h2 className="font-cinzel text-2xl font-bold text-[#f0c040]">{t("readyTitle")}</h2>
            <p className="text-sm text-[#8888aa]">{t("readySubtitle")}</p>
            <div className="mx-auto max-w-xs rounded-xl border border-[#1e1e3a] bg-[#13131f] p-4 text-left">
              <div className="flex items-center gap-3">
                <Flame className="size-6 text-[#f0c040]" />
                <div>
                  <p className="text-sm font-semibold text-[#e8e8f0]">LVL 1 · Novice</p>
                  <p className="text-xs text-[#8888aa]">0 XP · 5 health</p>
                </div>
              </div>
              <XpProgressBar currentXP={0} maxXP={500} className="mt-3" />
            </div>
            <Button
              className="w-full bg-[#f0c040] text-[#0a0a0f] hover:bg-[#e0b030]"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await completeOnboarding();
                  closeAndRefresh();
                })
              }
            >
              {t("enterLifeRpg")}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import type { useTranslations } from "next-intl";
import { ONBOARDING_HABIT_PRESETS } from "@/app/[locale]/(protected)/onboarding/actions";

export type OnboardingPresetKey = (typeof ONBOARDING_HABIT_PRESETS)[number]["key"];

export function getOnboardingPresetLabel(
  t: ReturnType<typeof useTranslations<"onboarding">>,
  key: OnboardingPresetKey,
): string {
  switch (key) {
    case "meditation":
      return t("presets.meditation");
    case "reading":
      return t("presets.reading");
    case "exercise":
      return t("presets.exercise");
    case "water":
      return t("presets.water");
    case "learn":
      return t("presets.learn");
    case "sleep":
      return t("presets.sleep");
    default:
      return key;
  }
}

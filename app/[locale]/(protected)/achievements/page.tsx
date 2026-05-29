import { getTranslations } from "next-intl/server";
import { getViewerContext } from "@/lib/viewer";
import { getAchievementsForUser } from "@/lib/achievements";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { cn } from "@/lib/utils";
import {
  Lock,
  ShieldCheck,
  Flame,
  Star,
  Sword,
  BookOpen,
  BookMarked,
  Brain,
  GraduationCap,
  ScrollText,
  Zap,
  Crown,
  Footprints,
  Trophy,
  Sparkles,
  Moon,
  Timer,
  Sun,
  Coins,
  Gem,
  TrendingUp,
  Award,
  Swords,
  Target,
  Medal,
  CalendarCheck,
  NotebookPen,
  Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Flame,
  Star,
  Crown,
  Sword,
  BookOpen,
  BookMarked,
  Brain,
  GraduationCap,
  ScrollText,
  Zap,
  ShieldCheck,
  Footprints,
  Trophy,
  Sparkles,
  Moon,
  Timer,
  Sun,
  Coins,
  Gem,
  TrendingUp,
  Award,
  Swords,
  Target,
  Medal,
  CalendarCheck,
  NotebookPen,
  Library,
};

export default async function AchievementsPage() {
  const t = await getTranslations("achievements");
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-rpg-muted">No user context found.</div>;

  await checkAndUnlockAchievements(viewer.userId);
  const achievements = await getAchievementsForUser(viewer.userId);

  return (
    <div className="space-y-10">
      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      {achievements.length === 0 ? (
        <RPGCard glow="none" className="p-6 text-center">
          <p className="text-rpg-secondary">{t("empty")}</p>
        </RPGCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {achievements.map((a) => {
          const locked = a.locked;
          const title = a.title.toLowerCase();
          const BadgeIcon = iconMap[a.icon] ?? (title.includes("streak") ? Flame : Star);
          return (
            <RPGCard
              key={a.id}
              glow="none"
              className={cn(
                "relative overflow-hidden",
                locked ? "rpg-achievement-locked" : "rpg-achievement-unlocked hover:scale-[1.02]",
              )}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative mb-3 flex h-14 w-14 items-center justify-center rounded-xl border",
                    locked
                      ? "border-rpg-border bg-rpg-surface"
                      : "border-rpg-gold/40 bg-rpg-gold/10",
                  )}
                >
                  <BadgeIcon
                    className={cn(
                      "size-12",
                      locked ? "text-rpg-secondary opacity-40" : "text-rpg-gold",
                    )}
                  />
                  {locked ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/25">
                      <Lock className="size-5 text-rpg-secondary" />
                    </div>
                  ) : null}
                </div>
                {locked ? (
                  <p className="rpg-section-heading mb-2 text-rpg-muted">{t("locked")}</p>
                ) : null}
                <p className={cn("rpg-habit-name font-heading", locked ? "text-[#555577]" : "text-rpg-text")}>
                  {a.title}
                </p>
                <p className={cn("rpg-body mt-1", locked ? "text-[#444466]" : "text-rpg-secondary")}>
                  {a.description}
                </p>
              </div>

              {!locked ? (
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-rpg-secondary">
                  <ShieldCheck className="size-4 text-rpg-success" />
                  {t("unlocked")}: {a.unlockedAt ? a.unlockedAt.toLocaleDateString() : ""}
                </div>
              ) : null}

              {locked && a.progress ? (
                <div className="mt-4 w-full">
                  <div className="mb-1 flex justify-between text-[10px] text-[#555577]">
                    <span>{t("progress")}</span>
                    <span>
                      {Math.min(a.progress.current, a.progress.target)} / {a.progress.target}
                    </span>
                  </div>
                  <div className="rpg-progress-track">
                    <div
                      className="rpg-progress-fill-purple"
                      style={{
                        width: `${Math.min(100, Math.round((a.progress.current / a.progress.target) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </RPGCard>
          );
        })}
      </div>
    </div>
  );
}

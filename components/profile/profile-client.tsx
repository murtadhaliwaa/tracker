"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { dispatchShellStats } from "@/lib/shell-stats-client";
import {
  Pencil,
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
  type LucideIcon,
} from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XpProgressBar } from "@/components/gamification/player-card";
import { PlayerAvatar } from "@/components/gamification/player-avatar";
import { ActivityHeatmap, type HeatmapDay } from "@/components/charts/activity-heatmap";
import { getPlayerDisplayName } from "@/lib/player-profile";
import { updateProfileName } from "@/app/[locale]/(protected)/profile/actions";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";

const achievementIconMap: Record<string, LucideIcon> = {
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

type AchievementItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
};

type Props = {
  name: string | null;
  avatarStyle: string | null;
  level: number;
  title: string;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  joinDate: string;
  habitsCompleted: number;
  longestStreak: number;
  achievements: AchievementItem[];
  heatmapDays: HeatmapDay[];
};

export function ProfileClient(props: Props) {
  const t = useTranslations("profile");
  const ta = useTranslations("achievements");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [profileName, setProfileName] = useState(props.name);
  const [avatarStyle, setAvatarStyle] = useState(props.avatarStyle);
  const [editingName, setEditingName] = useState(false);
  const [inlineName, setInlineName] = useState(props.name ?? "");
  const [editOpen, setEditOpen] = useState(false);

  const displayName = getPlayerDisplayName(profileName, t("playerFallback"));

  const saveInlineName = () => {
    startTransition(async () => {
      await updateProfileName(inlineName);
      setProfileName(inlineName.trim());
      dispatchShellStats({ playerName: inlineName.trim() });
      setEditingName(false);
    });
  };

  return (
    <div className="space-y-5">
      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      <RPGCard glow="gold" className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <PlayerAvatar name={profileName} avatarStyle={avatarStyle} size="md" />

          <div className="flex-1 space-y-3 text-center sm:text-start">
            {editingName ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Input
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  className="max-w-xs border-[#1e1e3a] bg-[#13131f]"
                />
                <Button size="sm" disabled={pending || !inlineName.trim()} onClick={saveInlineName}>
                  {tc("save")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                  {tc("cancel")}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="group inline-flex items-center gap-2"
                onClick={() => {
                  setInlineName(profileName ?? "");
                  setEditingName(true);
                }}
              >
                <h2 className="font-heading text-2xl text-rpg-text">{displayName}</h2>
                <Pencil className="size-4 text-rpg-secondary opacity-0 transition group-hover:opacity-100" />
              </button>
            )}

            <p className="text-sm text-rpg-secondary">
              {t("levelTitle", { level: props.level, title: props.title })}
            </p>

            <div className="max-w-md">
              <XpProgressBar currentXP={props.currentXP} maxXP={props.xpToNextLevel} />
              <p className="mt-1 text-xs text-rpg-secondary">
                {props.currentXP} / {props.xpToNextLevel} XP
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="border-rpg-gold/40 text-rpg-gold"
            onClick={() => setEditOpen(true)}
          >
            {t("editProfile")}
          </Button>
        </div>
      </RPGCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RPGCard glow="purple" className="p-4">
          <p className="text-xs text-rpg-secondary">{t("joinDate")}</p>
          <p className="mt-2 text-sm font-heading text-rpg-text">
            {new Date(props.joinDate).toLocaleDateString()}
          </p>
        </RPGCard>
        <RPGCard glow="teal" className="p-4">
          <p className="text-xs text-rpg-secondary">{t("habitsCompleted")}</p>
          <p className="mt-2 text-2xl font-heading text-rpg-text">{props.habitsCompleted}</p>
        </RPGCard>
        <RPGCard glow="red" className="p-4">
          <p className="text-xs text-rpg-secondary">{t("longestStreak")}</p>
          <p className="mt-2 text-2xl font-heading text-rpg-text">{props.longestStreak}</p>
        </RPGCard>
        <RPGCard glow="gold" className="p-4">
          <p className="text-xs text-rpg-secondary">{t("totalXp")}</p>
          <p className="mt-2 text-2xl font-heading text-rpg-text">{props.totalXP}</p>
        </RPGCard>
      </div>

      <RPGCard glow="purple" className="p-5">
        <h2 className="font-heading text-lg text-rpg-heading">{t("achievementsShowcase")}</h2>
        {props.achievements.length === 0 ? (
          <p className="mt-3 text-sm text-rpg-secondary">{ta("empty")}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {props.achievements.map((achievement) => {
              const titleLower = achievement.title.toLowerCase();
              const Icon =
                achievementIconMap[achievement.icon] ??
                (titleLower.includes("streak") ? Flame : Star);

              return (
                <div
                  key={achievement.id}
                  className="rounded-xl border border-rpg-gold/40 bg-rpg-gold/10 p-4"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-rpg-gold/40 bg-rpg-gold/10">
                    <Icon className="size-6 text-rpg-gold" />
                  </div>
                  <p className="font-heading text-sm text-rpg-text">{achievement.title}</p>
                  <p className="mt-1 text-xs text-rpg-secondary">{achievement.description}</p>
                  {achievement.unlockedAt ? (
                    <p className="mt-2 text-[11px] text-rpg-muted">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </RPGCard>

      <RPGCard glow="purple" className="p-5">
        <h2 className="font-heading text-lg text-rpg-heading">{t("activityHeatmap")}</h2>
        <p className="mt-1 text-sm text-rpg-secondary">{t("heatmapSubtitle")}</p>
        <div className="mt-4 min-w-0">
          <ActivityHeatmap days={props.heatmapDays} weeks={12} />
        </div>
      </RPGCard>

      {editOpen ? (
        <ProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          name={profileName}
          avatarStyle={avatarStyle}
          level={props.level}
          characterTitle={props.title}
          onSaved={(saved) => {
            setProfileName(saved.name);
            setAvatarStyle(saved.avatarStyle);
            dispatchShellStats({ playerName: saved.name });
          }}
        />
      ) : null}
    </div>
  );
}

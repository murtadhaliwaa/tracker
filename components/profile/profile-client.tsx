"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Flame, Star, Crown, Sword, BookOpen, Brain, GraduationCap, ScrollText, Zap } from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XpProgressBar } from "@/components/gamification/player-card";
import { ActivityHeatmap, type HeatmapDay } from "@/components/charts/activity-heatmap";
import {
  AVATAR_COLOR_OPTIONS,
  getAvatarBackground,
  getPlayerDisplayName,
  getPlayerInitials,
} from "@/lib/player-profile";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { updateProfile, updateProfileName } from "@/app/[locale]/(protected)/profile/actions";

const achievementIconMap: Record<string, LucideIcon> = {
  Flame,
  Star,
  Crown,
  Sword,
  BookOpen,
  Brain,
  GraduationCap,
  ScrollText,
  Zap,
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [inlineName, setInlineName] = useState(props.name ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState(props.name ?? "");
  const [formAvatar, setFormAvatar] = useState(props.avatarStyle ?? AVATAR_COLOR_OPTIONS[0].id);

  const displayName = getPlayerDisplayName(props.name, t("playerFallback"));
  const initials = getPlayerInitials(props.name);
  const avatarBackground = getAvatarBackground(props.avatarStyle);

  const saveInlineName = () => {
    startTransition(async () => {
      await updateProfileName(inlineName);
      setEditingName(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      <RPGCard glow="gold" className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full text-xl font-bold text-[#0a0a0f]"
            style={{ background: avatarBackground }}
          >
            {initials}
          </div>

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
                  setInlineName(props.name ?? "");
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
            onClick={() => {
              setFormName(props.name ?? "");
              setFormAvatar(props.avatarStyle ?? AVATAR_COLOR_OPTIONS[0].id);
              setEditOpen(true);
            }}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("nameLabel")}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="border-[#1e1e3a] bg-[#13131f]"
              />
            </div>
            <div>
              <Label>{t("avatarColor")}</Label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {AVATAR_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    aria-label={color.id}
                    onClick={() => setFormAvatar(color.id)}
                    className={cn(
                      "size-10 rounded-full border-2 transition",
                      formAvatar === color.id ? "border-[#f0c040]" : "border-transparent",
                    )}
                    style={{ background: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              disabled={pending || !formName.trim()}
              onClick={() =>
                startTransition(async () => {
                  await updateProfile({ name: formName.trim(), avatarStyle: formAvatar });
                  setEditOpen(false);
                  router.refresh();
                })
              }
            >
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

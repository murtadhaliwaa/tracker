import { cache } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getShellProfile } from "@/lib/page-data/shell-profile";
import { getTitleFromLevel } from "@/lib/level-utils";

export type ProfileAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
};

export type ProfilePageData = {
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
  achievements: ProfileAchievement[];
  heatmapDays: { date: string; count: number }[];
};

export const getProfilePageData = cache(async (userId: string): Promise<ProfilePageData> => {
  const heatmapStart = startOfDay(subDays(new Date(), 12 * 7 - 1));

  const [user, profile, completedCount, streaks, achievements, habitLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
    getShellProfile(userId),
    prisma.habitLog.count({ where: { userId, completed: true } }),
    prisma.streak.findMany({
      where: { userId },
      select: { longestStreak: true },
    }),
    prisma.achievement.findMany({
      where: { userId, unlockedAt: { not: null } },
      orderBy: { unlockedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        unlockedAt: true,
      },
    }),
    prisma.habitLog.findMany({
      where: { userId, completed: true, date: { gte: heatmapStart } },
      select: { date: true },
    }),
  ]);

  const longestStreak = Math.max(0, ...streaks.map((s) => s.longestStreak));
  const level = profile?.level ?? 1;

  const heatmapCounts = new Map<string, number>();
  for (const log of habitLogs) {
    const key = format(startOfDay(log.date), "yyyy-MM-dd");
    heatmapCounts.set(key, (heatmapCounts.get(key) ?? 0) + 1);
  }

  return {
    name: profile?.name ?? null,
    avatarStyle: profile?.avatarStyle ?? null,
    level,
    title: getTitleFromLevel(level),
    currentXP: profile?.currentXP ?? 0,
    xpToNextLevel: profile?.xpToNextLevel ?? 500,
    totalXP: profile?.totalXP ?? 0,
    joinDate: user?.createdAt.toISOString() ?? new Date().toISOString(),
    habitsCompleted: completedCount,
    longestStreak,
    achievements: achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlockedAt: a.unlockedAt?.toISOString() ?? null,
    })),
    heatmapDays: [...heatmapCounts.entries()].map(([date, count]) => ({ date, count })),
  };
});

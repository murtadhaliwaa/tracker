import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SettingsNotificationRow = {
  id: string | null;
  habitId: string;
  habitTitle: string;
  time: string;
  isEnabled: boolean;
};

export type SettingsRewardRow = {
  id: string;
  title: string;
  description: string | null;
  xpCost: number;
  emoji: string;
  claimedAt: string | null;
};

export type SettingsPageData = {
  locale: string;
  preferredLanguage: string;
  totalXP: number;
  notifications: SettingsNotificationRow[];
  rewards: SettingsRewardRow[];
};

export const getSettingsPageData = cache(
  async (userId: string, locale: string): Promise<SettingsPageData> => {
    const [profile, habits, notificationRows, rewards] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: { preferredLanguage: true, totalXP: true },
      }),
      prisma.habit.findMany({
        where: { userId, isArchived: false },
        orderBy: [{ period: "asc" }, { order: "asc" }],
        select: { id: true, title: true },
      }),
      prisma.notificationSetting.findMany({
        where: { userId },
        select: { id: true, habitId: true, time: true, isEnabled: true },
      }),
      prisma.rewardVault.findMany({
        where: { userId },
        orderBy: { xpCost: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          xpCost: true,
          emoji: true,
          claimedAt: true,
        },
      }),
    ]);

    const notificationsByHabit = new Map(notificationRows.map((n) => [n.habitId, n]));

    const notifications: SettingsNotificationRow[] = habits.map((habit) => {
      const setting = notificationsByHabit.get(habit.id);
      return {
        id: setting?.id ?? null,
        habitId: habit.id,
        habitTitle: habit.title,
        time: setting?.time || "08:00",
        isEnabled: setting?.isEnabled ?? false,
      };
    });

    return {
      locale,
      preferredLanguage: profile?.preferredLanguage ?? locale,
      totalXP: profile?.totalXP ?? 0,
      notifications,
      rewards: rewards.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        xpCost: r.xpCost,
        emoji: r.emoji,
        claimedAt: r.claimedAt?.toISOString() ?? null,
      })),
    };
  },
);

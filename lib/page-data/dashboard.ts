import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { todayLogFilter } from "@/lib/habit-day";
import { getWeeklyBossForDisplay, toBossPayload } from "@/lib/weekly-boss";
import { getShellProfile } from "@/lib/page-data/shell-profile";
import { resolveSessionStreak } from "@/lib/streak-session";

export type DashboardDailyHabit = {
  id: string;
  title: string;
  xpValue: number;
  icon: string;
  color: string;
  logType: "CHECKBOX" | "FORM" | "TIMER";
  currentStreak: number;
  completed: boolean;
};

export type DashboardPageData = {
  profile: Awaited<ReturnType<typeof getShellProfile>>;
  healthBar: {
    currentHealth: number;
    maxHealth: number;
  } | null;
  dailyHabits: DashboardDailyHabit[];
  boss: ReturnType<typeof toBossPayload>;
  reflection: { highlight: string; date: string } | null;
  streak: number;
  freezesAvailable: number;
  showOnboarding: boolean;
};

export const getDashboardPageData = cache(async (userId: string): Promise<DashboardPageData | null> => {
  const todayFilter = todayLogFilter();

  const [profile, healthBar, habits, reflection, sessionStreak, habitCount, boss] =
    await Promise.all([
      getShellProfile(userId),
      prisma.healthBar.findUnique({
        where: { userId },
        select: { currentHealth: true, maxHealth: true },
      }),
      prisma.habit.findMany({
        where: { userId, period: "DAILY", isArchived: false },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          xpValue: true,
          icon: true,
          color: true,
          logType: true,
          streak: { select: { currentStreak: true } },
          logs: { where: todayFilter, take: 1, select: { id: true } },
        },
      }),
      prisma.reflection.findFirst({
        where: { userId, type: "DAILY" },
        orderBy: { createdAt: "desc" },
        select: { answers: true, createdAt: true },
      }),
      resolveSessionStreak(userId),
      prisma.habit.count({ where: { userId, isArchived: false } }),
      getWeeklyBossForDisplay(userId),
    ]);

  if (!profile && habits.length === 0 && habitCount === 0) {
    return null;
  }

  const answers = reflection?.answers as { highlight?: string } | undefined;

  return {
    profile,
    healthBar,
    dailyHabits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      xpValue: habit.xpValue,
      icon: habit.icon,
      color: habit.color,
      logType: habit.logType,
      currentStreak: habit.streak?.currentStreak ?? 0,
      completed: habit.logs.length > 0,
    })),
    boss: toBossPayload(boss),
    reflection: reflection
      ? {
          highlight: answers?.highlight ?? "—",
          date: reflection.createdAt.toLocaleDateString(),
        }
      : null,
    streak: sessionStreak.currentStreak,
    freezesAvailable: sessionStreak.freezesAvailable,
    showOnboarding:
      !profile?.onboardingComplete && (profile?.totalXP ?? 0) === 0 && habitCount === 0,
  };
});

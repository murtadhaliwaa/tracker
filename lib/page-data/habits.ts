import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { todayLogFilter } from "@/lib/habit-day";
import type { HabitFrequency } from "@/lib/habit-display";

export type HabitClientItem = {
  id: string;
  title: string;
  description: string | null;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  xpValue: number;
  icon: string;
  color: string;
  logType: "CHECKBOX" | "FORM" | "TIMER";
  isArchived: boolean;
  order: number;
  category: string | null;
  frequency: HabitFrequency | null;
  currentStreak: number;
  completedToday: boolean;
};

export type HabitsPageData = {
  habits: HabitClientItem[];
  categories: string[];
};

export const getHabitsPageData = cache(async (userId: string): Promise<HabitsPageData> => {
  const todayFilter = todayLogFilter();

  const [habits, categories] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      orderBy: [{ period: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        period: true,
        xpValue: true,
        icon: true,
        color: true,
        logType: true,
        isArchived: true,
        order: true,
        category: true,
        frequency: true,
        streak: { select: { currentStreak: true } },
        logs: { where: todayFilter, take: 1, select: { id: true } },
      },
    }),
    prisma.habitCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return {
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      description: habit.description,
      period: habit.period,
      xpValue: habit.xpValue,
      icon: habit.icon,
      color: habit.color,
      logType: habit.logType,
      isArchived: habit.isArchived,
      order: habit.order,
      category: habit.category,
      frequency: habit.frequency as HabitFrequency | null,
      currentStreak: habit.streak?.currentStreak ?? 0,
      completedToday: habit.logs.length > 0,
    })),
    categories: categories.map((c) => c.name),
  };
});

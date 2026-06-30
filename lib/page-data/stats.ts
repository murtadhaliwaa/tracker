import { cache } from "react";
import {
  startOfWeek,
  subWeeks,
  format,
  subDays,
  startOfDay,
  endOfWeek,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { ensureStatsHistory, sumXpBetween } from "@/lib/backfill-stats-data";
import { buildLifeBalanceRadar } from "@/lib/life-balance-radar";
import type { LifeBalanceDimension } from "@/lib/life-balance-radar";
import type { HeatmapDay } from "@/components/charts/activity-heatmap";

export type StatsPageData = {
  weeklyXp: { name: string; xp: number }[];
  radar: { subject: LifeBalanceDimension; value: number }[];
  meditationTrend: { week: string; minutes: number }[];
  heatmapDays: HeatmapDay[];
  ghostLeague: {
    thisWeekXp: number;
    lastMonthXp: number;
    status: "ahead" | "behind" | "tied";
    chartData: { name: string; xp: number }[];
  };
};

async function loadHeatmapDays(userId: string, heatmapStart: Date): Promise<HeatmapDay[]> {
  const groups = await prisma.habitLog.groupBy({
    by: ["date"],
    where: {
      userId,
      completed: true,
      date: { gte: heatmapStart },
    },
    _count: { _all: true },
  });

  return groups.map((row) => ({
    date: startOfDay(row.date).toISOString().slice(0, 10),
    count: row._count._all,
  }));
}

export const getStatsPageData = cache(async (userId: string): Promise<StatsPageData> => {
  await ensureStatsHistory(userId);

  const now = new Date();
  const fourWeeksAgo = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
  const twelveWeeksAgo = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
  const heatmapStart = startOfDay(subDays(now, 365));

  const [tx, categories, habits, recentLogs, heatmapDays, meditations] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId, createdAt: { gte: twelveWeeksAgo } },
      orderBy: { createdAt: "asc" },
      select: { amount: true, createdAt: true },
    }),
    prisma.habitCategory.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: { id: true, categoryId: true, category: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId,
        completed: true,
        date: { gte: fourWeeksAgo },
      },
      select: { habitId: true },
    }),
    loadHeatmapDays(userId, heatmapStart),
    prisma.meditationSession.findMany({
      where: { userId, createdAt: { gte: fourWeeksAgo } },
      orderBy: { createdAt: "asc" },
      select: { duration: true, createdAt: true },
    }),
  ]);

  const weeklyXp = [0, 1, 2, 3].map((weeksAgo) => {
    const weekStart = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const labels = ["Current", "W-1", "W-2", "W-3"] as const;
    return {
      name: labels[weeksAgo],
      xp: sumXpBetween(tx, weekStart, weekEnd),
    };
  });

  const radar = buildLifeBalanceRadar(habits, categories, recentLogs);

  const meditationTrend = Array.from({ length: 4 }).map((_, i) => {
    const weekStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const minutes = meditations
      .filter((m) => m.createdAt >= weekStart && m.createdAt <= weekEnd)
      .reduce((a, m) => a + m.duration, 0);
    return { week: format(weekStart, "MMM d"), minutes };
  });

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekXP = sumXpBetween(tx, weekStart, now);
  const lastMonthStart = subWeeks(weekStart, 4);
  const lastMonthEnd = subWeeks(now, 4);
  const lastMonthXP = sumXpBetween(tx, lastMonthStart, lastMonthEnd);

  const ghostStatus =
    thisWeekXP > lastMonthXP ? "ahead" : thisWeekXP < lastMonthXP ? "behind" : ("tied" as const);

  return {
    weeklyXp,
    radar,
    meditationTrend,
    heatmapDays,
    ghostLeague: {
      thisWeekXp: thisWeekXP,
      lastMonthXp: lastMonthXP,
      status: ghostStatus,
      chartData: [
        { name: "This Week", xp: thisWeekXP > 0 ? thisWeekXP : 0 },
        { name: "Last Month", xp: lastMonthXP > 0 ? lastMonthXP : 0 },
      ],
    },
  };
});

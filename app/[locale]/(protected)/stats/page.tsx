import dynamic from "next/dynamic";
import {
  startOfWeek,
  subWeeks,
  format,
  subDays,
  startOfDay,
  endOfWeek,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { ensureStatsHistory, sumXpBetween } from "@/lib/backfill-stats-data";
import { PageLoading } from "@/components/ui/page-loading";

const StatsClient = dynamic(
  () => import("@/components/charts/stats-client").then((mod) => mod.StatsClient),
  {
    ssr: false,
    loading: () => <PageLoading variant="stats" />,
  },
);

export default async function StatsPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  await ensureStatsHistory(viewer.userId);

  const now = new Date();
  const fourWeeksAgo = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });
  const twelveWeeksAgo = startOfWeek(subWeeks(now, 11), { weekStartsOn: 1 });
  const heatmapStart = startOfDay(subDays(now, 365));

  const [tx, categories, habits, recentLogs, heatmapLogs, meditations] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId: viewer.userId, createdAt: { gte: twelveWeeksAgo } },
      orderBy: { createdAt: "asc" },
      select: { amount: true, createdAt: true },
    }),
    prisma.habitCategory.findMany({
      where: { userId: viewer.userId },
      select: { id: true, name: true },
    }),
    prisma.habit.findMany({
      where: { userId: viewer.userId, isArchived: false },
      select: { id: true, categoryId: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId: viewer.userId,
        completed: true,
        date: { gte: fourWeeksAgo },
      },
      select: { habitId: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId: viewer.userId,
        completed: true,
        date: { gte: heatmapStart },
      },
      select: { date: true },
    }),
    prisma.meditationSession.findMany({
      where: { userId: viewer.userId, createdAt: { gte: fourWeeksAgo } },
      orderBy: { createdAt: "asc" },
      select: { duration: true, createdAt: true },
    }),
  ]);

  const heatmapMap = new Map<string, number>();
  for (const log of heatmapLogs) {
    const key = startOfDay(log.date).toISOString().slice(0, 10);
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
  }
  const heatmapDays = [...heatmapMap.entries()].map(([date, count]) => ({ date, count }));

  const weeklyXp = [0, 1, 2, 3].map((weeksAgo) => {
    const weekStart = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const labels = ["Current", "W-1", "W-2", "W-3"] as const;

    return {
      name: labels[weeksAgo],
      xp: sumXpBetween(tx, weekStart, weekEnd),
    };
  });

  const logsByCategory = new Map<string, number>();
  for (const log of recentLogs) {
    const habit = habits.find((h) => h.id === log.habitId);
    if (!habit?.categoryId) continue;
    logsByCategory.set(habit.categoryId, (logsByCategory.get(habit.categoryId) ?? 0) + 1);
  }

  const rawRadarData = categories.map((category) => {
    const totalLogs = logsByCategory.get(category.id) ?? 0;
    const value = Math.max(0, Math.min(100, totalLogs * 12));
    return { subject: category.name, value };
  });
  const radarData = rawRadarData.map((item) => ({
    ...item,
    value: item.value === 0 ? 30 : item.value,
  }));

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

  const ghostData = [
    { name: "This Week", xp: thisWeekXP > 0 ? thisWeekXP : 0 },
    { name: "Last Month", xp: lastMonthXP > 0 ? lastMonthXP : 0 },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <StatsClient
        weeklyXp={weeklyXp}
        radar={radarData}
        meditationTrend={meditationTrend}
        heatmapDays={heatmapDays}
        ghostLeague={{
          thisWeekXp: thisWeekXP,
          lastMonthXp: lastMonthXP,
          status: ghostStatus,
          chartData: ghostData,
        }}
      />
    </div>
  );
}

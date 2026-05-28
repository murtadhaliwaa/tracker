import {
  addDays,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { prisma } from "@/lib/prisma";

const WEEKLY_XP_SAMPLES = [110, 85, 95, 70, 120, 55, 100, 90, 75, 130, 60, 45];

export async function ensureStatsHistory(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { statsSeeded: true },
  });

  if (profile?.statsSeeded) return;

  const existingLogCount = await prisma.habitLog.count({ where: { userId } });
  if (existingLogCount >= 30) {
    await prisma.userProfile.update({
      where: { userId },
      data: { statsSeeded: true },
    });
    return;
  }

  const now = new Date();
  const heatmapStart = startOfDay(subDays(now, 84));

  const [habits, categories, recentLogCount, meditationCount] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: { order: "asc" },
      take: 4,
    }),
    prisma.habitCategory.findMany({ where: { userId } }),
    prisma.habitLog.count({
      where: { userId, completed: true, date: { gte: heatmapStart } },
    }),
    prisma.meditationSession.count({ where: { userId } }),
  ]);

  let categoryIds = categories.map((c) => c.id);

  if (categoryIds.length === 0) {
    const created = await prisma.$transaction([
      prisma.habitCategory.create({
        data: { userId, name: "Mind", color: "#06b6d4" },
      }),
      prisma.habitCategory.create({
        data: { userId, name: "Body", color: "#22c55e" },
      }),
      prisma.habitCategory.create({
        data: { userId, name: "Knowledge", color: "#a78bfa" },
      }),
      prisma.habitCategory.create({
        data: { userId, name: "Discipline", color: "#f59e0b" },
      }),
    ]);
    categoryIds = created.map((c) => c.id);

    await Promise.all(
      habits.map((habit, index) =>
        habit.categoryId
          ? Promise.resolve()
          : prisma.habit.update({
              where: { id: habit.id },
              data: { categoryId: categoryIds[index % categoryIds.length] },
            }),
      ),
    );
  }

  for (let weeksAgo = 0; weeksAgo < 12; weeksAgo++) {
    const weekStart = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const existing = await prisma.xPTransaction.count({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    if (existing === 0) {
      await prisma.xPTransaction.create({
        data: {
          userId,
          amount: WEEKLY_XP_SAMPLES[weeksAgo] ?? 80,
          reason: "habit_completion",
          multiplier: 1,
          createdAt: addDays(weekStart, 2),
        },
      });
    }
  }

  if (habits.length > 0 && recentLogCount < 30) {
    for (let daysAgo = 0; daysAgo < 84; daysAgo++) {
      const day = startOfDay(subDays(now, daysAgo));
      const activityLevel = (84 - daysAgo) % 5;

      for (let i = 0; i < habits.length; i++) {
        if ((daysAgo + i) % 4 === 0) continue;

        const targetCount = activityLevel === 0 ? 3 : activityLevel === 1 ? 2 : 1;
        if (i >= targetCount) continue;

        try {
          await prisma.habitLog.create({
            data: {
              userId,
              habitId: habits[i].id,
              date: day,
              completed: true,
              logType: "CHECKBOX",
            },
          });
        } catch {
          // Skip duplicate habit/day entries.
        }
      }
    }
  }

  for (let weeksAgo = 0; weeksAgo < 4; weeksAgo++) {
    const weekStart = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const existing = await prisma.meditationSession.count({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    if (existing === 0) {
      await prisma.meditationSession.create({
        data: {
          userId,
          duration: [10, 15, 20, 25][weeksAgo] ?? 15,
          type: "breath",
          notes: "Stats sample session",
          createdAt: addDays(weekStart, 3),
        },
      });
    }
  }

  if (meditationCount === 0) {
    for (let weeksAgo = 4; weeksAgo < 8; weeksAgo++) {
      const weekStart = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
      await prisma.meditationSession.create({
        data: {
          userId,
          duration: 12 + weeksAgo * 2,
          type: "body scan",
          notes: "Stats sample session",
          createdAt: addDays(weekStart, 4),
        },
      });
    }
  }

  await prisma.userProfile.update({
    where: { userId },
    data: { statsSeeded: true },
  });
}

export function sumXpBetween(
  transactions: { amount: number; createdAt: Date }[],
  start: Date,
  end: Date,
) {
  return transactions
    .filter((t) => t.createdAt >= start && t.createdAt <= end)
    .reduce((total, t) => total + t.amount, 0);
}

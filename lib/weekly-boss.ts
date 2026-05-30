import { cache } from "react";
import { endOfWeek, getISOWeek, startOfDay, startOfWeek, subDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";

type Tx = Prisma.TransactionClient;

export const WEEKLY_BOSSES = [
  {
    key: "calm_scholar",
    title: "Boss: Calm Scholar",
    description: "Meditate 3 days + Read 3 days",
    targetValue: 8,
  },
  {
    key: "iron_will",
    title: "Boss: Iron Will",
    description: "Complete all habits 5 days in a row",
    targetValue: 5,
  },
  {
    key: "knowledge_seeker",
    title: "Boss: Knowledge Seeker",
    description: "Complete 5 course lessons",
    targetValue: 5,
  },
  {
    key: "mind_body",
    title: "Boss: Mind & Body",
    description: "Exercise 3 days + Meditate 3 days",
    targetValue: 6,
  },
  {
    key: "consistency_king",
    title: "Boss: Consistency King",
    description: "Complete any habit 7 days in a row",
    targetValue: 7,
  },
] as const;

const BOSS_XP_REWARD = 200;

type HabitRow = { id: string; title: string; period: string };

type BossProgressContext = {
  habits: HabitRow[];
  weekLogsByHabitDay: Set<string>;
  perfectDayStreak: number;
  courseLessons: number;
  maxHabitStreak: number;
};

function getBossTemplate(weekNumber: number) {
  return WEEKLY_BOSSES[weekNumber % WEEKLY_BOSSES.length]!;
}

function getWeekBounds(date = new Date()) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  return { weekStart, weekEnd };
}

function habitMatches(title: string, patterns: RegExp[]) {
  return patterns.some((p) => p.test(title));
}

async function countCourseLessonsThisWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  client: Tx | typeof prisma = prisma,
) {
  const [transactions, courses] = await Promise.all([
    client.xPTransaction.count({
      where: {
        userId,
        reason: "course_completion",
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    client.course.findMany({
      where: { userId, updatedAt: { gte: weekStart, lte: weekEnd } },
      select: { completedLessons: true },
    }),
  ]);

  return Math.max(transactions, courses.reduce((sum, c) => sum + c.completedLessons, 0));
}

async function loadBossProgressContext(
  userId: string,
  client: Tx | typeof prisma = prisma,
): Promise<BossProgressContext> {
  const { weekStart, weekEnd } = getWeekBounds();
  const rangeStart = startOfDay(subDays(new Date(), 13));

  const habits = await client.habit.findMany({
    where: { userId, isArchived: false },
    select: { id: true, title: true, period: true },
  });

  const habitIds = habits.map((h) => h.id);
  const dailyHabitIds = habits.filter((h) => h.period === "DAILY").map((h) => h.id);

  if (habitIds.length === 0) {
    return {
      habits,
      weekLogsByHabitDay: new Set(),
      perfectDayStreak: 0,
      courseLessons: await countCourseLessonsThisWeek(userId, weekStart, weekEnd, client),
      maxHabitStreak: 0,
    };
  }

  const [weekLogs, recentDayCounts, courseLessons, streakRows] = await Promise.all([
    client.habitLog.findMany({
      where: {
        userId,
        completed: true,
        habitId: { in: habitIds },
        date: { gte: weekStart, lte: weekEnd },
      },
      select: { habitId: true, date: true },
    }),
    dailyHabitIds.length > 0
      ? client.habitLog.groupBy({
          by: ["date"],
          where: {
            userId,
            completed: true,
            habitId: { in: dailyHabitIds },
            date: { gte: rangeStart },
          },
          _count: { habitId: true },
        })
      : Promise.resolve([]),
    countCourseLessonsThisWeek(userId, weekStart, weekEnd, client),
    client.streak.findMany({
      where: { userId, habitId: { not: null } },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  const weekLogsByHabitDay = new Set(
    weekLogs.map((log) => `${log.habitId}:${startOfDay(log.date).getTime()}`),
  );

  const requiredCount = dailyHabitIds.length;
  const perfectDays = new Set(
    recentDayCounts
      .filter((entry) => entry._count.habitId >= requiredCount)
      .map((entry) => startOfDay(entry.date).getTime()),
  );

  let perfectDayStreak = 0;
  for (let offset = 0; offset < 14; offset++) {
    const day = startOfDay(subDays(new Date(), offset)).getTime();
    if (perfectDays.has(day)) perfectDayStreak++;
    else break;
  }

  const maxHabitStreak =
    streakRows.length === 0
      ? 0
      : Math.max(...streakRows.map((s) => Math.max(s.currentStreak, s.longestStreak)));

  return {
    habits,
    weekLogsByHabitDay,
    perfectDayStreak,
    courseLessons,
    maxHabitStreak,
  };
}

function countDistinctDaysForPatterns(ctx: BossProgressContext, patterns: RegExp[]) {
  const ids = new Set(
    ctx.habits.filter((h) => habitMatches(h.title, patterns)).map((h) => h.id),
  );
  if (ids.size === 0) return 0;

  const days = new Set<number>();
  for (const key of ctx.weekLogsByHabitDay) {
    const [habitId, dayMs] = key.split(":");
    if (ids.has(habitId!)) days.add(Number(dayMs));
  }
  return days.size;
}

function calculateProgressFromContext(ctx: BossProgressContext, weekNumber: number) {
  const template = getBossTemplate(weekNumber);

  switch (template.key) {
    case "calm_scholar": {
      const medDays = countDistinctDaysForPatterns(ctx, [/meditat/i, /mindful/i, /lotus/i]);
      const readDays = countDistinctDaysForPatterns(ctx, [/read/i, /book/i]);
      return Math.min(
        template.targetValue,
        Math.min(medDays, 3) + Math.min(readDays, 3) + Math.min(2, Math.min(medDays, readDays)),
      );
    }
    case "iron_will":
      return Math.min(template.targetValue, ctx.perfectDayStreak);
    case "knowledge_seeker":
      return Math.min(template.targetValue, ctx.courseLessons);
    case "mind_body": {
      const exerciseDays = countDistinctDaysForPatterns(ctx, [
        /exercise/i,
        /workout/i,
        /gym/i,
        /train/i,
        /dumbbell/i,
      ]);
      const medDays = countDistinctDaysForPatterns(ctx, [/meditat/i, /mindful/i, /lotus/i]);
      return Math.min(template.targetValue, Math.min(exerciseDays, 3) + Math.min(medDays, 3));
    }
    case "consistency_king":
      return Math.min(template.targetValue, ctx.maxHabitStreak);
    default:
      return 0;
  }
}

export async function calculateBossProgress(
  userId: string,
  weekNumber: number,
  client: Tx | typeof prisma = prisma,
) {
  const ctx = await loadBossProgressContext(userId, client);
  return calculateProgressFromContext(ctx, weekNumber);
}

export async function ensureWeeklyBoss(userId: string, client: Tx | typeof prisma = prisma) {
  const weekNumber = getISOWeek(new Date());
  const template = getBossTemplate(weekNumber);

  return client.weeklyBossChallenge.upsert({
    where: { userId_weekNumber: { userId, weekNumber } },
    update: {},
    create: {
      userId,
      weekNumber,
      title: template.title,
      description: template.description,
      targetValue: template.targetValue,
      currentValue: 0,
      xpReward: BOSS_XP_REWARD,
      isCompleted: false,
    },
  });
}

/** Fast read path: returns cached boss row without recalculating progress. */
export const getWeeklyBossForDisplay = cache(async (userId: string) => {
  return ensureWeeklyBoss(userId);
});

export async function refreshWeeklyBoss(userId: string, client: Tx | typeof prisma = prisma) {
  const weekNumber = getISOWeek(new Date());
  const boss = await ensureWeeklyBoss(userId, client);
  const currentValue = await calculateBossProgress(userId, weekNumber, client);

  return client.weeklyBossChallenge.update({
    where: { id: boss.id },
    data: { currentValue },
  });
}

export type BossSyncResult = {
  boss: Awaited<ReturnType<typeof refreshWeeklyBoss>>;
  leveledUp: boolean;
  xpAwarded: number;
  newLevel: number;
  newTitle: string;
};

export async function syncWeeklyBossProgress(userId: string, tx?: Tx): Promise<BossSyncResult> {
  const run = async (client: Tx) => {
    const updated = await refreshWeeklyBoss(userId, client);

    if (updated.isCompleted || updated.currentValue < updated.targetValue) {
      return {
        boss: updated,
        leveledUp: false,
        xpAwarded: 0,
        newLevel: 0,
        newTitle: "",
      };
    }

    await client.weeklyBossChallenge.update({
      where: { id: updated.id },
      data: { isCompleted: true, currentValue: updated.targetValue },
    });

    const xpResult = await awardXP(client, userId, BOSS_XP_REWARD, "streak_bonus", 1);
    return { boss: updated, ...xpResult };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run);
}

export function toBossPayload(boss: Awaited<ReturnType<typeof ensureWeeklyBoss>>) {
  return {
    title: boss.title,
    description: boss.description,
    currentValue: boss.currentValue,
    targetValue: boss.targetValue,
    xpReward: boss.xpReward,
    isCompleted: boss.isCompleted,
  };
}

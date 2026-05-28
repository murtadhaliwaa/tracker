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

async function countDistinctLogDays(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  titlePatterns: RegExp[],
  client: Tx | typeof prisma = prisma,
) {
  const habits = await client.habit.findMany({
    where: { userId, isArchived: false },
    select: { id: true, title: true },
  });
  const habitIds = habits
    .filter((h) => habitMatches(h.title, titlePatterns))
    .map((h) => h.id);
  if (habitIds.length === 0) return 0;

  const days = await client.habitLog.groupBy({
    by: ["date"],
    where: {
      userId,
      completed: true,
      habitId: { in: habitIds },
      date: { gte: weekStart, lte: weekEnd },
    },
  });

  return days.length;
}

async function countPerfectDayStreak(userId: string, client: Tx | typeof prisma = prisma) {
  const dailyHabits = await client.habit.findMany({
    where: { userId, period: "DAILY", isArchived: false },
    select: { id: true },
  });
  const requiredCount = dailyHabits.length;
  if (requiredCount === 0) return 0;

  const habitIds = dailyHabits.map((h) => h.id);
  const rangeStart = startOfDay(subDays(new Date(), 13));

  const dayCounts = await client.habitLog.groupBy({
    by: ["date"],
    where: {
      userId,
      completed: true,
      habitId: { in: habitIds },
      date: { gte: rangeStart },
    },
    _count: { habitId: true },
  });

  const perfectDays = new Set(
    dayCounts
      .filter((entry) => entry._count.habitId >= requiredCount)
      .map((entry) => startOfDay(entry.date).getTime()),
  );

  let streak = 0;
  for (let offset = 0; offset < 14; offset++) {
    const day = startOfDay(subDays(new Date(), offset)).getTime();
    if (perfectDays.has(day)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function countCourseLessonsThisWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  client: Tx | typeof prisma = prisma,
) {
  const transactions = await client.xPTransaction.count({
    where: {
      userId,
      reason: "course_completion",
      createdAt: { gte: weekStart, lte: weekEnd },
    },
  });

  const courses = await client.course.findMany({
    where: { userId, updatedAt: { gte: weekStart, lte: weekEnd } },
    select: { completedLessons: true },
  });

  return Math.max(transactions, courses.reduce((sum, c) => sum + c.completedLessons, 0));
}

async function maxHabitStreak(userId: string, client: Tx | typeof prisma = prisma) {
  const streaks = await client.streak.findMany({
    where: { userId, habitId: { not: null } },
    select: { currentStreak: true, longestStreak: true },
  });
  if (streaks.length === 0) return 0;
  return Math.max(...streaks.map((s) => Math.max(s.currentStreak, s.longestStreak)));
}

export async function calculateBossProgress(
  userId: string,
  weekNumber: number,
  client: Tx | typeof prisma = prisma,
) {
  const template = getBossTemplate(weekNumber);
  const { weekStart, weekEnd } = getWeekBounds();

  switch (template.key) {
    case "calm_scholar": {
      const medDays = await countDistinctLogDays(
        userId,
        weekStart,
        weekEnd,
        [/meditat/i, /mindful/i, /lotus/i],
        client,
      );
      const readDays = await countDistinctLogDays(
        userId,
        weekStart,
        weekEnd,
        [/read/i, /book/i],
        client,
      );
      return Math.min(
        template.targetValue,
        Math.min(medDays, 3) + Math.min(readDays, 3) + Math.min(2, Math.min(medDays, readDays)),
      );
    }
    case "iron_will":
      return Math.min(template.targetValue, await countPerfectDayStreak(userId, client));
    case "knowledge_seeker":
      return Math.min(
        template.targetValue,
        await countCourseLessonsThisWeek(userId, weekStart, weekEnd, client),
      );
    case "mind_body": {
      const exerciseDays = await countDistinctLogDays(
        userId,
        weekStart,
        weekEnd,
        [/exercise/i, /workout/i, /gym/i, /train/i, /dumbbell/i],
        client,
      );
      const medDays = await countDistinctLogDays(
        userId,
        weekStart,
        weekEnd,
        [/meditat/i, /mindful/i, /lotus/i],
        client,
      );
      return Math.min(template.targetValue, Math.min(exerciseDays, 3) + Math.min(medDays, 3));
    }
    case "consistency_king":
      return Math.min(template.targetValue, await maxHabitStreak(userId, client));
    default:
      return 0;
  }
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

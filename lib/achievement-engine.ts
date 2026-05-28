import { startOfWeek, subWeeks } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

const ACHIEVEMENT_DEFINITIONS = [
  {
    type: "streak_30",
    title: "30-Day Warrior",
    description: "Complete any habit 30 days in a row",
    icon: "Sword",
    check: (ctx: AchievementContext) => ctx.maxStreak >= 30,
  },
  {
    type: "pages_500",
    title: "Knowledge Seeker",
    description: "Read 500 pages total",
    icon: "BookOpen",
    check: (ctx: AchievementContext) => ctx.totalPages >= 500,
  },
  {
    type: "meditation_20",
    title: "Zen Master",
    description: "Log 20 meditation sessions",
    icon: "Brain",
    check: (ctx: AchievementContext) => ctx.meditationCount >= 20,
  },
  {
    type: "course_complete",
    title: "Course Conqueror",
    description: "Complete any course 100%",
    icon: "GraduationCap",
    check: (ctx: AchievementContext) => ctx.courseComplete,
  },
  {
    type: "weekly_reviews_4",
    title: "Weekly Champion",
    description: "Complete 4 weekly reviews in a row",
    icon: "ScrollText",
    check: (ctx: AchievementContext) => ctx.weeklyStreak >= 4,
  },
  {
    type: "deep_work_10h",
    title: "Deep Worker",
    description: "Log 10 hours of focused work",
    icon: "Zap",
    check: (ctx: AchievementContext) => ctx.focusedMinutes >= 600,
  },
] as const;

type AchievementContext = {
  maxStreak: number;
  totalPages: number;
  meditationCount: number;
  courseComplete: boolean;
  weeklyStreak: number;
  focusedMinutes: number;
};

function countConsecutiveWeeklyReviews(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prevWeek = startOfWeek(sorted[i - 1]!, { weekStartsOn: 0 });
    const expected = subWeeks(prevWeek, 1);
    const currentWeek = startOfWeek(sorted[i]!, { weekStartsOn: 0 });
    if (currentWeek.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function buildAchievementContext(userId: string, tx?: Tx): Promise<AchievementContext> {
  const client = tx ?? prisma;

  const [streaks, readingPages, meditationCount, courses, weeklyReviews, timerMinutes, deepMeditationMinutes] =
    await Promise.all([
      client.streak.findMany({ where: { userId, habitId: { not: null } } }),
      client.readingSession.aggregate({
        where: { userId },
        _sum: { pagesRead: true },
      }),
      client.meditationSession.count({ where: { userId } }),
      client.course.findMany({ where: { userId } }),
      client.reflection.findMany({
        where: { userId, type: "WEEKLY" },
        orderBy: { createdAt: "desc" },
      }),
      client.habitLog.aggregate({
        where: { userId, duration: { not: null } },
        _sum: { duration: true },
      }),
      client.meditationSession.aggregate({
        where: { userId, focusMultiplierEarned: { gte: 1.5 } },
        _sum: { duration: true },
      }),
    ]);

  return {
    maxStreak: Math.max(0, ...streaks.map((s) => Math.max(s.currentStreak, s.longestStreak))),
    totalPages: readingPages._sum.pagesRead ?? 0,
    meditationCount,
    courseComplete: courses.some((c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons),
    weeklyStreak: countConsecutiveWeeklyReviews(weeklyReviews.map((r) => r.createdAt)),
    focusedMinutes: (timerMinutes._sum.duration ?? 0) + (deepMeditationMinutes._sum.duration ?? 0),
  };
}

export async function checkAndUnlockAchievements(userId: string, tx?: Tx) {
  const client = tx ?? prisma;
  const ctx = await buildAchievementContext(userId, tx);
  const existing = await client.achievement.findMany({ where: { userId } });
  const existingTypes = new Set(existing.map((a) => a.type).filter(Boolean));

  const unlocked: string[] = [];
  const toCreate = ACHIEVEMENT_DEFINITIONS.filter(
    (def) => !existingTypes.has(def.type) && def.check(ctx),
  );

  if (toCreate.length > 0) {
    await client.achievement.createMany({
      data: toCreate.map((def) => ({
        userId,
        type: def.type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: new Date(),
      })),
      skipDuplicates: true,
    });
    unlocked.push(...toCreate.map((def) => def.type));
  }

  return unlocked;
}

export { buildAchievementContext, ACHIEVEMENT_DEFINITIONS };

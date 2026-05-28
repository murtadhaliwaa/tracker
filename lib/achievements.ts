import { startOfWeek, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievement-engine";

export type AchievementDisplay = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date | null;
  locked: boolean;
  progress?: { current: number; target: number };
};

function progressForType(
  type: string,
  ctx: {
    maxStreak: number;
    totalPages: number;
    meditationCount: number;
    weeklyStreak: number;
    focusedMinutes: number;
  },
): { current: number; target: number } | undefined {
  switch (type) {
    case "streak_7":
      return { current: ctx.maxStreak, target: 7 };
    case "streak_30":
      return { current: ctx.maxStreak, target: 30 };
    case "pages_500":
      return { current: ctx.totalPages, target: 500 };
    case "meditation_20":
      return { current: ctx.meditationCount, target: 20 };
    case "weekly_reviews_4":
      return { current: ctx.weeklyStreak, target: 4 };
    case "deep_work_10h":
      return { current: ctx.focusedMinutes, target: 600 };
    default:
      return undefined;
  }
}

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

export async function getAchievementsForUser(userId: string): Promise<AchievementDisplay[]> {
  const [dbAchievements, streaks, perfectDayCount, readingPages, meditationCount, courses, weeklyReviews, timerMinutes, deepMeditationMinutes] =
    await Promise.all([
      prisma.achievement.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.streak.findMany({ where: { userId, habitId: { not: null } } }),
      prisma.xPTransaction.count({ where: { userId, reason: "perfect_day" } }),
      prisma.readingSession.aggregate({
        where: { userId },
        _sum: { pagesRead: true },
      }),
      prisma.meditationSession.count({ where: { userId } }),
      prisma.course.findMany({ where: { userId } }),
      prisma.reflection.findMany({
        where: { userId, type: "WEEKLY" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.habitLog.aggregate({
        where: { userId, duration: { not: null } },
        _sum: { duration: true },
      }),
      prisma.meditationSession.aggregate({
        where: { userId, focusMultiplierEarned: { gte: 1.5 } },
        _sum: { duration: true },
      }),
    ]);

  const dbByType = new Map(dbAchievements.filter((a) => a.type).map((a) => [a.type!, a]));
  const dbByTitle = new Map(dbAchievements.map((a) => [a.title.toLowerCase(), a]));

  const maxStreak = Math.max(0, ...streaks.map((s) => Math.max(s.currentStreak, s.longestStreak)));
  const totalPages = readingPages._sum.pagesRead ?? 0;
  const courseComplete = courses.some((c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons);
  const weeklyStreak = countConsecutiveWeeklyReviews(weeklyReviews.map((r) => r.createdAt));
  const focusedMinutes = (timerMinutes._sum.duration ?? 0) + (deepMeditationMinutes._sum.duration ?? 0);

  const ctx = {
    maxStreak,
    hasPerfectDay: perfectDayCount > 0,
    totalPages,
    meditationCount,
    courseComplete,
    weeklyStreak,
    focusedMinutes,
  };

  const computed = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const db = dbByType.get(def.type) ?? dbByTitle.get(def.title.toLowerCase());
    const unlocked = Boolean(db?.unlockedAt) || def.check(ctx);
    return {
      id: db?.id ?? def.type,
      title: def.title,
      description: def.description,
      icon: def.icon,
      unlockedAt: db?.unlockedAt ?? (unlocked ? new Date() : null),
      locked: !unlocked,
      progress: !unlocked ? progressForType(def.type, ctx) : undefined,
    };
  });

  const customDb = dbAchievements
    .filter((a) => !a.type && !ACHIEVEMENT_DEFINITIONS.some((d) => d.title.toLowerCase() === a.title.toLowerCase()))
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlockedAt: a.unlockedAt,
      locked: !a.unlockedAt,
    }));

  return [...computed, ...customDb];
}

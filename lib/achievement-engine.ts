import { startOfWeek, subWeeks } from "date-fns";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export type AchievementContext = {
  maxStreak: number;
  habitCompletions: number;
  perfectDayCount: number;
  totalPages: number;
  meditationCount: number;
  meditationMinutes: number;
  courseComplete: boolean;
  coursesCompleted: number;
  weeklyStreak: number;
  weeklyReviewCount: number;
  focusedMinutes: number;
  totalXp: number;
  level: number;
  bossWins: number;
};

export const ACHIEVEMENT_DEFINITIONS = [
  {
    type: "first_step",
    title: "First Step",
    description: "Complete your first habit",
    icon: "Footprints",
    check: (ctx: AchievementContext) => ctx.habitCompletions >= 1,
  },
  {
    type: "streak_7",
    title: "Week of Fire",
    description: "Maintain a 7-day habit streak",
    icon: "Flame",
    check: (ctx: AchievementContext) => ctx.maxStreak >= 7,
  },
  {
    type: "streak_30",
    title: "30-Day Warrior",
    description: "Complete any habit 30 days in a row",
    icon: "Sword",
    check: (ctx: AchievementContext) => ctx.maxStreak >= 30,
  },
  {
    type: "streak_100",
    title: "Century Streak",
    description: "Reach a 100-day habit streak",
    icon: "Crown",
    check: (ctx: AchievementContext) => ctx.maxStreak >= 100,
  },
  {
    type: "habit_hero_50",
    title: "Habit Hero",
    description: "Complete 50 habits total",
    icon: "ShieldCheck",
    check: (ctx: AchievementContext) => ctx.habitCompletions >= 50,
  },
  {
    type: "habit_legend_500",
    title: "Habit Legend",
    description: "Complete 500 habits total",
    icon: "Trophy",
    check: (ctx: AchievementContext) => ctx.habitCompletions >= 500,
  },
  {
    type: "perfect_day",
    title: "Perfect Day",
    description: "Earn your first perfect day bonus",
    icon: "Star",
    check: (ctx: AchievementContext) => ctx.perfectDayCount >= 1,
  },
  {
    type: "perfect_days_5",
    title: "Golden Week",
    description: "Earn 5 perfect day bonuses",
    icon: "Sun",
    check: (ctx: AchievementContext) => ctx.perfectDayCount >= 5,
  },
  {
    type: "pages_50",
    title: "Page Turner",
    description: "Read 50 pages total",
    icon: "BookOpen",
    check: (ctx: AchievementContext) => ctx.totalPages >= 50,
  },
  {
    type: "pages_500",
    title: "Knowledge Seeker",
    description: "Read 500 pages total",
    icon: "BookMarked",
    check: (ctx: AchievementContext) => ctx.totalPages >= 500,
  },
  {
    type: "pages_1000",
    title: "Library Master",
    description: "Read 1,000 pages total",
    icon: "Library",
    check: (ctx: AchievementContext) => ctx.totalPages >= 1000,
  },
  {
    type: "meditation_5",
    title: "Calm Beginner",
    description: "Log 5 meditation sessions",
    icon: "Brain",
    check: (ctx: AchievementContext) => ctx.meditationCount >= 5,
  },
  {
    type: "meditation_20",
    title: "Zen Master",
    description: "Log 20 meditation sessions",
    icon: "Sparkles",
    check: (ctx: AchievementContext) => ctx.meditationCount >= 20,
  },
  {
    type: "meditation_50",
    title: "Mind Sage",
    description: "Log 50 meditation sessions",
    icon: "Moon",
    check: (ctx: AchievementContext) => ctx.meditationCount >= 50,
  },
  {
    type: "calm_hour",
    title: "Hour of Calm",
    description: "Meditate for 60 total minutes",
    icon: "Timer",
    check: (ctx: AchievementContext) => ctx.meditationMinutes >= 60,
  },
  {
    type: "course_complete",
    title: "Course Conqueror",
    description: "Complete any course 100%",
    icon: "GraduationCap",
    check: (ctx: AchievementContext) => ctx.courseComplete,
  },
  {
    type: "scholar_3",
    title: "Triple Scholar",
    description: "Complete 3 courses",
    icon: "Award",
    check: (ctx: AchievementContext) => ctx.coursesCompleted >= 3,
  },
  {
    type: "first_reflection",
    title: "First Reflection",
    description: "Write your first weekly review",
    icon: "ScrollText",
    check: (ctx: AchievementContext) => ctx.weeklyReviewCount >= 1,
  },
  {
    type: "weekly_reviews_4",
    title: "Weekly Champion",
    description: "Complete 4 weekly reviews in a row",
    icon: "CalendarCheck",
    check: (ctx: AchievementContext) => ctx.weeklyStreak >= 4,
  },
  {
    type: "journal_12",
    title: "Year of Reflection",
    description: "Write 12 weekly reviews",
    icon: "NotebookPen",
    check: (ctx: AchievementContext) => ctx.weeklyReviewCount >= 12,
  },
  {
    type: "deep_work_1h",
    title: "Focus Starter",
    description: "Log 1 hour of focused work",
    icon: "Timer",
    check: (ctx: AchievementContext) => ctx.focusedMinutes >= 60,
  },
  {
    type: "deep_work_10h",
    title: "Deep Worker",
    description: "Log 10 hours of focused work",
    icon: "Zap",
    check: (ctx: AchievementContext) => ctx.focusedMinutes >= 600,
  },
  {
    type: "deep_work_50h",
    title: "Focus Legend",
    description: "Log 50 hours of focused work",
    icon: "Target",
    check: (ctx: AchievementContext) => ctx.focusedMinutes >= 3000,
  },
  {
    type: "xp_1000",
    title: "XP Apprentice",
    description: "Earn 1,000 total XP",
    icon: "Coins",
    check: (ctx: AchievementContext) => ctx.totalXp >= 1000,
  },
  {
    type: "xp_10000",
    title: "XP Master",
    description: "Earn 10,000 total XP",
    icon: "Gem",
    check: (ctx: AchievementContext) => ctx.totalXp >= 10000,
  },
  {
    type: "level_5",
    title: "Level Five",
    description: "Reach player level 5",
    icon: "TrendingUp",
    check: (ctx: AchievementContext) => ctx.level >= 5,
  },
  {
    type: "level_10",
    title: "Double Digits",
    description: "Reach player level 10",
    icon: "Medal",
    check: (ctx: AchievementContext) => ctx.level >= 10,
  },
  {
    type: "boss_slayer",
    title: "Boss Slayer",
    description: "Complete your first weekly boss",
    icon: "Swords",
    check: (ctx: AchievementContext) => ctx.bossWins >= 1,
  },
] as const;

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

export async function buildAchievementContext(userId: string, tx?: Tx): Promise<AchievementContext> {
  const client = tx ?? prisma;

  const [
    streaks,
    habitCompletions,
    perfectDayCount,
    readingPages,
    meditationStats,
    courses,
    weeklyReviews,
    timerMinutes,
    deepMeditationMinutes,
    profile,
    bossWins,
  ] = await Promise.all([
    client.streak.findMany({ where: { userId, habitId: { not: null } } }),
    client.habitLog.count({ where: { userId, completed: true } }),
    client.xPTransaction.count({ where: { userId, reason: "perfect_day" } }),
    client.readingSession.aggregate({
      where: { userId },
      _sum: { pagesRead: true },
    }),
    client.meditationSession.aggregate({
      where: { userId },
      _count: true,
      _sum: { duration: true },
    }),
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
    client.userProfile.findUnique({
      where: { userId },
      select: { level: true, totalXP: true },
    }),
    client.weeklyBossChallenge.count({
      where: { userId, isCompleted: true },
    }),
  ]);

  const coursesCompleted = courses.filter(
    (c) => c.totalLessons > 0 && c.completedLessons >= c.totalLessons,
  ).length;

  return {
    maxStreak: Math.max(0, ...streaks.map((s) => Math.max(s.currentStreak, s.longestStreak))),
    habitCompletions,
    perfectDayCount,
    totalPages: readingPages._sum.pagesRead ?? 0,
    meditationCount: meditationStats._count,
    meditationMinutes: meditationStats._sum.duration ?? 0,
    courseComplete: coursesCompleted > 0,
    coursesCompleted,
    weeklyStreak: countConsecutiveWeeklyReviews(weeklyReviews.map((r) => r.createdAt)),
    weeklyReviewCount: weeklyReviews.length,
    focusedMinutes: (timerMinutes._sum.duration ?? 0) + (deepMeditationMinutes._sum.duration ?? 0),
    totalXp: profile?.totalXP ?? 0,
    level: profile?.level ?? 1,
    bossWins,
  };
}

/** Per-request cache — avoids duplicate heavy aggregates on the achievements page. */
export const getAchievementContext = cache((userId: string) => buildAchievementContext(userId));

export async function checkAndUnlockAchievements(userId: string, tx?: Tx) {
  const client = tx ?? prisma;
  const ctx = tx ? await buildAchievementContext(userId, tx) : await getAchievementContext(userId);
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

import { prisma } from "@/lib/prisma";
import {
  ACHIEVEMENT_DEFINITIONS,
  buildAchievementContext,
  getAchievementContext,
  type AchievementContext,
} from "@/lib/achievement-engine";

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
  ctx: AchievementContext,
): { current: number; target: number } | undefined {
  switch (type) {
    case "first_step":
      return { current: ctx.habitCompletions, target: 1 };
    case "streak_7":
      return { current: ctx.maxStreak, target: 7 };
    case "streak_30":
      return { current: ctx.maxStreak, target: 30 };
    case "streak_100":
      return { current: ctx.maxStreak, target: 100 };
    case "habit_hero_50":
      return { current: ctx.habitCompletions, target: 50 };
    case "habit_legend_500":
      return { current: ctx.habitCompletions, target: 500 };
    case "perfect_day":
      return { current: ctx.perfectDayCount, target: 1 };
    case "perfect_days_5":
      return { current: ctx.perfectDayCount, target: 5 };
    case "pages_50":
      return { current: ctx.totalPages, target: 50 };
    case "pages_500":
      return { current: ctx.totalPages, target: 500 };
    case "pages_1000":
      return { current: ctx.totalPages, target: 1000 };
    case "meditation_5":
      return { current: ctx.meditationCount, target: 5 };
    case "meditation_20":
      return { current: ctx.meditationCount, target: 20 };
    case "meditation_50":
      return { current: ctx.meditationCount, target: 50 };
    case "calm_hour":
      return { current: ctx.meditationMinutes, target: 60 };
    case "scholar_3":
      return { current: ctx.coursesCompleted, target: 3 };
    case "first_reflection":
      return { current: ctx.weeklyReviewCount, target: 1 };
    case "weekly_reviews_4":
      return { current: ctx.weeklyStreak, target: 4 };
    case "journal_12":
      return { current: ctx.weeklyReviewCount, target: 12 };
    case "deep_work_1h":
      return { current: ctx.focusedMinutes, target: 60 };
    case "deep_work_10h":
      return { current: ctx.focusedMinutes, target: 600 };
    case "deep_work_50h":
      return { current: ctx.focusedMinutes, target: 3000 };
    case "xp_1000":
      return { current: ctx.totalXp, target: 1000 };
    case "xp_10000":
      return { current: ctx.totalXp, target: 10000 };
    case "level_5":
      return { current: ctx.level, target: 5 };
    case "level_10":
      return { current: ctx.level, target: 10 };
    case "boss_slayer":
      return { current: ctx.bossWins, target: 1 };
    default:
      return undefined;
  }
}

export async function getAchievementsForUser(userId: string): Promise<AchievementDisplay[]> {
  const [dbAchievements, ctx] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    getAchievementContext(userId),
  ]);

  const dbByType = new Map(dbAchievements.filter((a) => a.type).map((a) => [a.type!, a]));
  const dbByTitle = new Map(dbAchievements.map((a) => [a.title.toLowerCase(), a]));

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

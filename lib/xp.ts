import type { Prisma } from "@prisma/client";
import {
  getLevelProgress,
  getTitleFromLevel,
} from "@/lib/level-utils";

export {
  getLevelFromTotalXP,
  getLevelProgress,
  getStreakMultiplier,
  getThresholdForLevel,
  getTitleFromLevel,
} from "@/lib/level-utils";

export type XpReason =
  | "habit_completion"
  | "course_completion"
  | "lesson_completion"
  | "deep_work"
  | "streak_bonus"
  | "perfect_day"
  | "recovery_quest"
  | "meditation"
  | "reading"
  | "weekly_review"
  | "reward_redeem";

export type AwardXpResult = {
  xpAwarded: number;
  newLevel: number;
  leveledUp: boolean;
  newTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
};

type Tx = Prisma.TransactionClient;

export async function awardXP(
  tx: Tx,
  userId: string,
  amount: number,
  reason: XpReason,
  multiplier = 1,
): Promise<AwardXpResult> {
  const xpAwarded = Math.max(0, Math.round(amount * multiplier));

  await tx.xPTransaction.create({
    data: {
      userId,
      amount: xpAwarded,
      reason,
      multiplier,
    },
  });

  const existing = await tx.userProfile.findUnique({ where: { userId } });
  const previousLevel = existing?.level ?? 1;
  const newTotalXP = (existing?.totalXP ?? 0) + xpAwarded;
  const progress = getLevelProgress(newTotalXP);
  const newTitle = getTitleFromLevel(progress.level);

  await tx.userProfile.upsert({
    where: { userId },
    update: {
      totalXP: newTotalXP,
      currentXP: progress.currentXP,
      xpToNextLevel: progress.xpToNextLevel,
      level: progress.level,
      title: newTitle,
    },
    create: {
      userId,
      totalXP: newTotalXP,
      currentXP: progress.currentXP,
      xpToNextLevel: progress.xpToNextLevel,
      level: progress.level,
      title: newTitle,
    },
  });

  return {
    xpAwarded,
    newLevel: progress.level,
    leveledUp: progress.level > previousLevel,
    newTitle,
    currentXP: progress.currentXP,
    xpToNextLevel: progress.xpToNextLevel,
    totalXP: newTotalXP,
  };
}

export async function deductXP(
  tx: Tx,
  userId: string,
  amount: number,
  reason: XpReason = "reward_redeem",
): Promise<AwardXpResult & { success: boolean }> {
  const existing = await tx.userProfile.findUnique({ where: { userId } });
  const totalXP = existing?.totalXP ?? 0;
  if (totalXP < amount) {
    return {
      success: false,
      xpAwarded: 0,
      newLevel: existing?.level ?? 1,
      leveledUp: false,
      newTitle: existing?.title ?? "Novice",
      currentXP: existing?.currentXP ?? 0,
      xpToNextLevel: existing?.xpToNextLevel ?? 500,
      totalXP,
    };
  }

  await tx.xPTransaction.create({
    data: { userId, amount: -amount, reason, multiplier: 1 },
  });

  const newTotalXP = totalXP - amount;
  const progress = getLevelProgress(newTotalXP);
  const newTitle = getTitleFromLevel(progress.level);

  await tx.userProfile.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      currentXP: progress.currentXP,
      xpToNextLevel: progress.xpToNextLevel,
      level: progress.level,
      title: newTitle,
    },
  });

  return {
    success: true,
    xpAwarded: -amount,
    newLevel: progress.level,
    leveledUp: false,
    newTitle,
    currentXP: progress.currentXP,
    xpToNextLevel: progress.xpToNextLevel,
    totalXP: newTotalXP,
  };
}

export async function checkPerfectDay(
  tx: Tx,
  userId: string,
): Promise<{ isPerfectDay: boolean; bonusAwarded: boolean; bonusXp: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const dailyHabits = await tx.habit.findMany({
    where: { userId, period: "DAILY", isArchived: false },
    include: {
      logs: {
        where: { date: { gte: start, lte: end }, completed: true },
      },
    },
  });

  if (dailyHabits.length === 0) {
    return { isPerfectDay: false, bonusAwarded: false, bonusXp: 0 };
  }

  const isPerfectDay = dailyHabits.every((h) => h.logs.length > 0);
  if (!isPerfectDay) {
    return { isPerfectDay: false, bonusAwarded: false, bonusXp: 0 };
  }

  const existingBonus = await tx.xPTransaction.findFirst({
    where: {
      userId,
      reason: "perfect_day",
      createdAt: { gte: start, lte: end },
    },
  });

  if (existingBonus) {
    return { isPerfectDay: true, bonusAwarded: false, bonusXp: existingBonus.amount };
  }

  const dayXp = dailyHabits.reduce((sum, h) => sum + h.xpValue, 0);
  await awardXP(tx, userId, dayXp, "perfect_day", 2);

  return { isPerfectDay: true, bonusAwarded: true, bonusXp: dayXp * 2 };
}

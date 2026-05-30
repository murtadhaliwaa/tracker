import { cache } from "react";
import { startOfDay, subDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextStreakState } from "@/lib/streak";

type Tx = Prisma.TransactionClient;

export async function getOverallStreak(userId: string, tx?: Tx) {
  const client = tx ?? prisma;
  return client.streak.findFirst({
    where: { userId, habitId: null },
  });
}

export async function updateOverallStreakOnDailyCompletion(
  tx: Tx,
  userId: string,
  today: Date = startOfDay(new Date()),
) {
  const completedTodayCount = await tx.habitLog.count({
    where: {
      userId,
      completed: true,
      date: today,
    },
  });

  if (completedTodayCount !== 1) return null;

  const streak = await tx.streak.findFirst({
    where: { userId, habitId: null },
  });

  const yesterday = startOfDay(subDays(today, 1));
  const completedYesterday =
    (await tx.habitLog.count({
      where: { userId, completed: true, date: yesterday },
    })) > 0;

  let newStreak = streak?.currentStreak ?? 0;
  let applyHealthPenalty = false;

  if (completedYesterday || !streak?.lastCompletedDate) {
    const nextState = nextStreakState(
      streak?.lastCompletedDate ? startOfDay(streak.lastCompletedDate) : null,
      streak?.currentStreak ?? 0,
      today,
    );
    newStreak = nextState.streak;
  } else if (newStreak > 0) {
    newStreak = 0;
    applyHealthPenalty = true;
  } else {
    newStreak = 1;
  }

  if (applyHealthPenalty) {
    const health = await tx.healthBar.findUnique({ where: { userId } });
    if (health) {
      const nextHealth = Math.max(0, health.currentHealth - 1);
      await tx.healthBar.update({
        where: { userId },
        data: {
          currentHealth: nextHealth,
          isWounded: nextHealth === 0,
          lastPenaltyDate: today,
        },
      });
    }
  }

  if (streak) {
    return tx.streak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastCompletedDate: today,
      },
    });
  }

  return tx.streak.create({
    data: {
      userId,
      habitId: null,
      currentStreak: newStreak,
      longestStreak: newStreak,
      lastCompletedDate: today,
      freezesAvailable: 2,
    },
  });
}

async function resolveMissedStreakDays(userId: string) {
  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(today, 1));

  const streak = await prisma.streak.findFirst({
    where: { userId, habitId: null },
  });

  if (!streak) return null;

  if (
    streak.lastMissedCheckAt &&
    startOfDay(streak.lastMissedCheckAt).getTime() === today.getTime()
  ) {
    return streak;
  }

  const completedYesterday =
    (await prisma.habitLog.count({
      where: { userId, completed: true, date: yesterday },
    })) > 0;

  if (completedYesterday) {
    await prisma.streak.update({
      where: { id: streak.id },
      data: { lastMissedCheckAt: today },
    });
    return streak;
  }

  if (streak.lastCompletedDate && startOfDay(streak.lastCompletedDate) >= yesterday) {
    await prisma.streak.update({
      where: { id: streak.id },
      data: { lastMissedCheckAt: today },
    });
    return streak;
  }

  const freezeCoversYesterday =
    streak.lastFreezeUsedAt &&
    startOfDay(streak.lastFreezeUsedAt).getTime() >= yesterday.getTime();

  if (freezeCoversYesterday) {
    await prisma.streak.update({
      where: { id: streak.id },
      data: { lastCompletedDate: yesterday, lastMissedCheckAt: today },
    });
    return prisma.streak.findFirst({ where: { id: streak.id } });
  }

  if ((streak.currentStreak ?? 0) === 0) {
    await prisma.streak.update({
      where: { id: streak.id },
      data: { lastMissedCheckAt: today },
    });
    return streak;
  }

  const health = await prisma.healthBar.findUnique({ where: { userId } });

  await prisma.$transaction(async (tx) => {
    await tx.streak.update({
      where: { id: streak.id },
      data: { currentStreak: 0, lastMissedCheckAt: today },
    });

    if (health) {
      const nextHealth = Math.max(0, health.currentHealth - 1);
      await tx.healthBar.update({
        where: { userId },
        data: {
          currentHealth: nextHealth,
          isWounded: nextHealth === 0,
          lastPenaltyDate: today,
        },
      });
    }
  });

  return prisma.streak.findFirst({ where: { id: streak.id } });
}

/** Per-request cache — layout + pages share one streak check. */
export const processMissedStreakDays = cache(resolveMissedStreakDays);

export async function applyStreakFreeze(userId: string) {
  const streak = await prisma.streak.findFirst({
    where: { userId, habitId: null },
  });

  if (!streak || streak.freezesAvailable <= 0) {
    throw new Error("No freezes available");
  }

  const today = startOfDay(new Date());

  return prisma.streak.update({
    where: { id: streak.id },
    data: {
      freezesAvailable: streak.freezesAvailable - 1,
      freezesUsed: streak.freezesUsed + 1,
      lastFreezeUsedAt: today,
    },
  });
}

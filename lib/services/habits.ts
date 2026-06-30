import { startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { applyHealthPenalty } from "@/lib/health";
import { awardXP, checkPerfectDay } from "@/lib/xp";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { updateOverallStreakOnDailyCompletion } from "@/lib/streak-engine";
import { nextStreakState } from "@/lib/streak";
import { habitFormSchema, habitLogSchema, updateHabitSchema } from "@/lib/validators";

async function upsertCategory(userId: string, name: string, color: string) {
  return prisma.habitCategory.upsert({
    where: { userId_name: { userId, name } },
    update: { color },
    create: { userId, name, color },
  });
}

export async function listHabits(userId: string, includeArchived = false) {
  const recentCutoff = startOfDay(subDays(new Date(), 30));

  return prisma.habit.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    include: {
      logs: {
        where: { date: { gte: recentCutoff } },
        orderBy: { date: "desc" },
      },
      streak: true,
      categoryRef: true,
    },
    orderBy: [{ period: "asc" }, { order: "asc" }],
  });
}

export async function createHabitForUser(userId: string, input: unknown) {
  const parsed = habitFormSchema.parse(input);
  const category = await upsertCategory(userId, parsed.categoryName, parsed.color);
  const maxOrder = await prisma.habit.aggregate({
    where: { userId, period: parsed.period, isArchived: false },
    _max: { order: true },
  });

  const habit = await prisma.habit.create({
    data: {
      userId,
      title: parsed.title,
      description: parsed.description,
      period: parsed.period,
      frequency: parsed.frequency,
      logType: parsed.logType,
      categoryId: category.id,
      category: parsed.categoryName,
      xpValue: parsed.xpValue,
      icon: parsed.icon,
      color: parsed.color,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  await prisma.streak.create({
    data: { userId, habitId: habit.id, freezesAvailable: 2 },
  });

  await prisma.notificationSetting.create({
    data: {
      userId,
      habitId: habit.id,
      time: "08:00",
      isEnabled: false,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
  });

  return habit;
}

export async function updateHabitForUser(userId: string, input: unknown) {
  const parsed = updateHabitSchema.parse(input);
  const category = await upsertCategory(userId, parsed.categoryName, parsed.color);

  const result = await prisma.habit.updateMany({
    where: { id: parsed.id, userId },
    data: {
      title: parsed.title,
      description: parsed.description,
      period: parsed.period,
      frequency: parsed.frequency,
      logType: parsed.logType,
      categoryId: category.id,
      category: parsed.categoryName,
      xpValue: parsed.xpValue,
      icon: parsed.icon,
      color: parsed.color,
    },
  });

  if (result.count === 0) throw new Error("Habit not found");
  return { success: true as const };
}

export async function deleteHabitForUser(userId: string, habitId: string) {
  const result = await prisma.habit.deleteMany({ where: { id: habitId, userId } });
  if (result.count === 0) throw new Error("Habit not found");
  return { success: true as const };
}

export async function completeHabitForUser(userId: string, input: unknown) {
  const parsed = habitLogSchema.parse(input);
  const today = startOfDay(parsed.date ?? new Date());

  const result = await prisma.$transaction(async (tx) => {
    const habit = await tx.habit.findFirst({
      where: { id: parsed.habitId, userId, isArchived: false },
    });
    if (!habit) throw new Error("Habit not found");

    const log = await tx.habitLog.upsert({
      where: { habitId_date: { habitId: habit.id, date: today } },
      update: {
        completed: true,
        notes: parsed.notes,
        duration: parsed.duration,
        logType: parsed.logType,
        recoveryQuest: parsed.recoveryQuest ?? false,
      },
      create: {
        userId,
        habitId: habit.id,
        date: today,
        completed: true,
        notes: parsed.notes,
        duration: parsed.duration,
        logType: parsed.logType,
        recoveryQuest: parsed.recoveryQuest ?? false,
      },
    });

    const streak = await tx.streak.findFirst({
      where: { habitId: habit.id, userId },
    });

    const nextState = nextStreakState(
      streak?.lastCompletedDate ?? null,
      streak?.currentStreak ?? 0,
      today,
    );

    await tx.streak.upsert({
      where: { userId_habitId: { userId, habitId: habit.id } },
      update: {
        currentStreak: nextState.streak,
        longestStreak: Math.max(streak?.longestStreak ?? 0, nextState.streak),
        lastCompletedDate: today,
      },
      create: {
        userId,
        habitId: habit.id,
        currentStreak: nextState.streak,
        longestStreak: nextState.streak,
        lastCompletedDate: today,
        freezesAvailable: 2,
      },
    });

    if (nextState.missedDays >= 2) {
      const health = await tx.healthBar.findUnique({ where: { userId } });
      if (health) {
        const nextHealth = applyHealthPenalty(
          {
            currentHealth: health.currentHealth,
            maxHealth: health.maxHealth,
            isWounded: health.isWounded,
          },
          nextState.missedDays,
        );
        await tx.healthBar.update({
          where: { userId },
          data: {
            currentHealth: nextHealth.currentHealth,
            isWounded: nextHealth.isWounded,
          },
        });
      }
    }

    let multiplier = 1;
    if (parsed.deepFocus) multiplier *= 1.5;
    if (parsed.recoveryQuest) multiplier *= 1.5;
    if (parsed.logType === "TIMER" && parsed.duration) {
      multiplier *= Math.max(1, parsed.duration / Math.max(1, habit.xpValue));
    }
    multiplier *= streak?.currentStreak && streak.currentStreak >= 7 ? 1.1 : 1;

    const xpResult = await awardXP(
      tx,
      userId,
      habit.xpValue,
      parsed.recoveryQuest ? "recovery_quest" : "habit_completion",
      multiplier,
    );

    if (parsed.recoveryQuest) {
      const health = await tx.healthBar.findUnique({ where: { userId } });
      if (health) {
        const nextHealth = Math.min(health.maxHealth, health.currentHealth + 1);
        await tx.healthBar.update({
          where: { userId },
          data: { currentHealth: nextHealth, isWounded: nextHealth === 0, recoveryQuestCompleted: true },
        });
      }
    }

    if (habit.period === "DAILY") {
      await updateOverallStreakOnDailyCompletion(tx, userId, today);
    }

    const perfectDay = await checkPerfectDay(tx, userId);
    return { log, ...xpResult, perfectDay, unlockedAchievements: [] as string[] };
  });

  void checkAndUnlockAchievements(userId).catch(() => undefined);
  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import { subDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { applyStreakFreeze } from "@/lib/streak-engine";
import { recoveryQuestSchema } from "@/lib/validators";

export async function useStreakFreeze() {
  const viewer = await requireViewer();

  const streak = await applyStreakFreeze(viewer.userId);

  revalidatePath("/en/dashboard");
  revalidatePath("/ar/dashboard");
  return { success: true as const, remaining: streak.freezesAvailable };
}

export async function getMissedHabitsYesterday() {
  const viewer = await requireViewer();
  const yesterday = startOfDay(subDays(new Date(), 1));

  const habits = await prisma.habit.findMany({
    where: { userId: viewer.userId, period: "DAILY", isArchived: false },
    include: {
      logs: { where: { date: yesterday, completed: true } },
    },
  });

  return habits
    .filter((h) => h.logs.length === 0)
    .map((h) => ({ id: h.id, title: h.title, xpValue: h.xpValue, color: h.color, icon: h.icon }));
}

export async function startRecoveryQuest(input: unknown) {
  const viewer = await requireViewer();
  const parsed = recoveryQuestSchema.parse(input);

  const habit = await prisma.habit.findFirst({
    where: { id: parsed.habitId, userId: viewer.userId, isArchived: false },
  });
  if (!habit) throw new Error("Habit not found");

  return { success: true as const, habitId: habit.id, title: habit.title };
}

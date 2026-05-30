"use server";

import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import {
  completeHabitForUser,
  createHabitForUser,
  deleteHabitForUser,
  updateHabitForUser,
} from "@/lib/services/habits";
import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { syncWeeklyBossProgress } from "@/lib/weekly-boss";
import { habitOrderSchema } from "@/lib/validators";

function revalidateHabitPages(includeDashboard = false) {
  revalidateLocalePaths("/habits", ...(includeDashboard ? ["/dashboard"] as const : []));
}

export async function createHabit(input: unknown) {
  const viewer = await requireViewer();
  const habit = await createHabitForUser(viewer.userId, input);
  await revalidateHabitPages();
  return { success: true as const, habitId: habit.id };
}

export async function updateHabit(input: unknown) {
  const viewer = await requireViewer();
  await updateHabitForUser(viewer.userId, input);
  await revalidateHabitPages();
  return { success: true as const };
}

export async function deleteHabit(habitId: string) {
  const viewer = await requireViewer();
  await deleteHabitForUser(viewer.userId, habitId);
  await revalidateHabitPages();
  return { success: true as const };
}

export async function archiveHabit(habitId: string) {
  const viewer = await requireViewer();
  await prisma.habit.updateMany({
    where: { id: habitId, userId: viewer.userId },
    data: { isArchived: true },
  });
  await revalidateHabitPages();
  return { success: true as const };
}

export async function unarchiveHabit(habitId: string) {
  const viewer = await requireViewer();
  await prisma.habit.updateMany({
    where: { id: habitId, userId: viewer.userId },
    data: { isArchived: false },
  });
  await revalidateHabitPages();
  return { success: true as const };
}

export async function updateHabitOrder(input: unknown) {
  const viewer = await requireViewer();
  const parsed = habitOrderSchema.parse(input);

  await prisma.$transaction(
    parsed.items.map((item) =>
      prisma.habit.updateMany({
        where: { id: item.id, userId: viewer.userId },
        data: { order: item.order },
      }),
    ),
  );

  await revalidateHabitPages();
  return { success: true as const };
}

export async function logHabit(input: unknown) {
  const viewer = await requireViewer();
  const result = await completeHabitForUser(viewer.userId, input);
  const [, bossResult] = await Promise.all([
    revalidateHabitPages(true),
    syncWeeklyBossProgress(viewer.userId),
  ]);
  return { ...result, boss: bossResult.boss };
}

export async function getCategories() {
  const viewer = await requireViewer();
  return prisma.habitCategory.findMany({
    where: { userId: viewer.userId },
    orderBy: { name: "asc" },
    select: { name: true, color: true },
  });
}

"use server";

import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import {
  languageSchema,
  notificationTimeSchema,
  notificationToggleSchema,
  rewardFormSchema,
} from "@/lib/validators";

const DEFAULT_NOTIFICATION_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function revalidateSettings() {
  revalidateLocalePaths("/settings");
}

async function resolveNotificationId(
  userId: string,
  parsed: { id?: string; habitId?: string; time?: string },
) {
  if (parsed.id) return parsed.id;

  const habitId = parsed.habitId;
  if (!habitId) throw new Error("Notification id or habitId required");

  const existing = await prisma.notificationSetting.findFirst({
    where: { userId, habitId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.notificationSetting.create({
    data: {
      userId,
      habitId,
      time: parsed.time ?? "08:00",
      isEnabled: false,
      days: DEFAULT_NOTIFICATION_DAYS,
    },
  });
  return created.id;
}

export async function ensureNotificationSettings() {
  const viewer = await requireViewer();
  const habits = await prisma.habit.findMany({
    where: { userId: viewer.userId, isArchived: false },
    select: { id: true, title: true },
  });
  const existing = await prisma.notificationSetting.findMany({
    where: { userId: viewer.userId },
    select: { habitId: true, id: true, time: true, isEnabled: true },
  });
  const byHabit = new Map(existing.map((row) => [row.habitId, row]));
  const missing = habits.filter((habit) => !byHabit.has(habit.id));

  if (missing.length > 0) {
    await prisma.notificationSetting.createMany({
      data: missing.map((habit) => ({
        userId: viewer.userId,
        habitId: habit.id,
        time: "08:00",
        isEnabled: false,
        days: DEFAULT_NOTIFICATION_DAYS,
      })),
      skipDuplicates: true,
    });
  }

  const rows = await prisma.notificationSetting.findMany({
    where: { userId: viewer.userId },
    select: { id: true, habitId: true, time: true, isEnabled: true },
  });
  const rowByHabit = new Map(rows.map((row) => [row.habitId, row]));

  return habits.map((habit) => {
    const row = rowByHabit.get(habit.id);
    return {
      id: row?.id ?? null,
      habitId: habit.id,
      habitTitle: habit.title,
      time: row?.time ?? "08:00",
      isEnabled: row?.isEnabled ?? false,
    };
  });
}

export async function updatePreferredLanguage(input: unknown) {
  const viewer = await requireViewer();
  const parsed = languageSchema.parse(input);

  await prisma.userProfile.upsert({
    where: { userId: viewer.userId },
    update: { preferredLanguage: parsed.language },
    create: { userId: viewer.userId, preferredLanguage: parsed.language },
  });

  revalidateSettings();
  return { success: true as const, language: parsed.language };
}

function parseNotificationToggle(input: unknown, enabled: boolean) {
  const base =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  return notificationToggleSchema.parse({ ...base, enabled });
}

export async function enableNotification(input: unknown) {
  const viewer = await requireViewer();
  const parsed = parseNotificationToggle(input, true);
  const id = await resolveNotificationId(viewer.userId, parsed);
  await prisma.notificationSetting.updateMany({
    where: { id, userId: viewer.userId },
    data: { isEnabled: true },
  });
  revalidateSettings();
  return { success: true as const, id };
}

export async function disableNotification(input: unknown) {
  const viewer = await requireViewer();
  const parsed = parseNotificationToggle(input, false);
  const id = await resolveNotificationId(viewer.userId, parsed);
  await prisma.notificationSetting.updateMany({
    where: { id, userId: viewer.userId },
    data: { isEnabled: false },
  });
  revalidateSettings();
  return { success: true as const, id };
}

export async function updateNotificationTime(input: unknown) {
  const viewer = await requireViewer();
  const parsed = notificationTimeSchema.parse(input);
  const id = await resolveNotificationId(viewer.userId, parsed);
  await prisma.notificationSetting.updateMany({
    where: { id, userId: viewer.userId },
    data: { time: parsed.time },
  });
  revalidateSettings();
  return { success: true as const, id };
}

export async function createReward(input: unknown) {
  const viewer = await requireViewer();
  const parsed = rewardFormSchema.parse(input);

  const reward = await prisma.rewardVault.create({
    data: {
      userId: viewer.userId,
      title: parsed.title,
      description: parsed.description,
      xpCost: parsed.xpCost,
      emoji: parsed.emoji,
    },
  });

  revalidateSettings();
  return {
    reward: {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      xpCost: reward.xpCost,
      emoji: reward.emoji,
    },
  };
}

export async function updateReward(input: unknown) {
  const viewer = await requireViewer();
  const parsed = rewardFormSchema.extend({ id: rewardFormSchema.shape.id.unwrap() }).parse(input);

  await prisma.rewardVault.updateMany({
    where: { id: parsed.id, userId: viewer.userId },
    data: {
      title: parsed.title,
      description: parsed.description,
      xpCost: parsed.xpCost,
      emoji: parsed.emoji,
    },
  });

  revalidateSettings();
  return { success: true as const };
}

export async function deleteReward(rewardId: string) {
  const viewer = await requireViewer();
  await prisma.rewardVault.deleteMany({ where: { id: rewardId, userId: viewer.userId } });
  revalidateSettings();
  return { success: true as const };
}

export async function exportUserData() {
  const viewer = await requireViewer();

  const [habits, logs, courses, meditations, readings, reviews, xpTransactions, profile, streaks, healthBar] =
    await Promise.all([
      prisma.habit.findMany({ where: { userId: viewer.userId } }),
      prisma.habitLog.findMany({ where: { userId: viewer.userId }, orderBy: { date: "desc" } }),
      prisma.course.findMany({ where: { userId: viewer.userId } }),
      prisma.meditationSession.findMany({ where: { userId: viewer.userId } }),
      prisma.readingSession.findMany({ where: { userId: viewer.userId } }),
      prisma.reflection.findMany({ where: { userId: viewer.userId } }),
      prisma.xPTransaction.findMany({ where: { userId: viewer.userId } }),
      prisma.userProfile.findUnique({ where: { userId: viewer.userId } }),
      prisma.streak.findMany({ where: { userId: viewer.userId } }),
      prisma.healthBar.findUnique({ where: { userId: viewer.userId } }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    habits,
    habitLogs: logs,
    courses,
    meditationSessions: meditations,
    readingSessions: readings,
    reflections: reviews,
    xpTransactions,
    streaks,
    healthBar,
  };
}

export async function exportHabitLogsCsv() {
  const viewer = await requireViewer();
  const logs = await prisma.habitLog.findMany({
    where: { userId: viewer.userId },
    include: { habit: { select: { title: true } } },
    orderBy: { date: "desc" },
  });

  const header = "date,habit,completed,notes,duration,logType,recoveryQuest";
  const rows = logs.map((log) =>
    [
      log.date.toISOString(),
      `"${log.habit.title.replace(/"/g, '""')}"`,
      log.completed,
      `"${(log.notes ?? "").replace(/"/g, '""')}"`,
      log.duration ?? "",
      log.logType,
      log.recoveryQuest,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

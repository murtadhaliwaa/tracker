import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { SettingsClient } from "@/components/settings/settings-client";

const DEFAULT_NOTIFICATION_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const [profile, habits, notificationRows, rewards] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: viewer.userId } }),
    prisma.habit.findMany({
      where: { userId: viewer.userId, isArchived: false },
      orderBy: [{ period: "asc" }, { order: "asc" }],
    }),
    prisma.notificationSetting.findMany({ where: { userId: viewer.userId } }),
    prisma.rewardVault.findMany({ where: { userId: viewer.userId }, orderBy: { xpCost: "asc" } }),
  ]);

  const notificationsByHabit = new Map(notificationRows.map((n) => [n.habitId, n]));
  const missingHabitIds = habits
    .filter((habit) => !notificationsByHabit.has(habit.id))
    .map((habit) => habit.id);

  if (missingHabitIds.length > 0) {
    await prisma.notificationSetting.createMany({
      data: missingHabitIds.map((habitId) => ({
        userId: viewer.userId,
        habitId,
        time: "08:00",
        isEnabled: false,
        days: DEFAULT_NOTIFICATION_DAYS,
      })),
      skipDuplicates: true,
    });

    const created = await prisma.notificationSetting.findMany({
      where: { userId: viewer.userId, habitId: { in: missingHabitIds } },
    });
    for (const row of created) {
      notificationsByHabit.set(row.habitId, row);
    }
  }

  const notifications = habits.flatMap((habit) => {
    const setting = notificationsByHabit.get(habit.id);
    if (!setting) return [];
    return [
      {
        id: setting.id,
        habitTitle: habit.title,
        time: setting.time || "08:00",
        isEnabled: setting.isEnabled,
      },
    ];
  });

  return (
    <SettingsClient
      locale={locale}
      preferredLanguage={profile?.preferredLanguage ?? locale}
      totalXP={profile?.totalXP ?? 0}
      notifications={notifications}
      rewards={rewards.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        xpCost: r.xpCost,
        emoji: r.emoji,
        claimedAt: r.claimedAt?.toISOString() ?? null,
      }))}
    />
  );
}

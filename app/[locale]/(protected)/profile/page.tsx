import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { getTitleFromLevel } from "@/lib/level-utils";
import { format, subDays, startOfDay } from "date-fns";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const heatmapStart = startOfDay(subDays(new Date(), 12 * 7 - 1));

  const [user, profile, completedCount, streaks, achievements, habitLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: viewer.userId } }),
    prisma.userProfile.findUnique({ where: { userId: viewer.userId } }),
    prisma.habitLog.count({ where: { userId: viewer.userId, completed: true } }),
    prisma.streak.findMany({ where: { userId: viewer.userId } }),
    prisma.achievement.findMany({
      where: { userId: viewer.userId, unlockedAt: { not: null } },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.habitLog.findMany({
      where: { userId: viewer.userId, completed: true, date: { gte: heatmapStart } },
      select: { date: true },
    }),
  ]);

  const longestStreak = Math.max(0, ...streaks.map((s) => s.longestStreak));
  const level = profile?.level ?? 1;

  const heatmapCounts = new Map<string, number>();
  for (const log of habitLogs) {
    const key = format(startOfDay(log.date), "yyyy-MM-dd");
    heatmapCounts.set(key, (heatmapCounts.get(key) ?? 0) + 1);
  }

  return (
    <ProfileClient
      name={profile?.name ?? null}
      avatarStyle={profile?.avatarStyle ?? null}
      level={level}
      title={getTitleFromLevel(level)}
      currentXP={profile?.currentXP ?? 0}
      xpToNextLevel={profile?.xpToNextLevel ?? 500}
      totalXP={profile?.totalXP ?? 0}
      joinDate={user?.createdAt.toISOString() ?? new Date().toISOString()}
      habitsCompleted={completedCount}
      longestStreak={longestStreak}
      achievements={achievements.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlockedAt?.toISOString() ?? null,
      }))}
      heatmapDays={[...heatmapCounts.entries()].map(([date, count]) => ({ date, count }))}
    />
  );
}

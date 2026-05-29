import { redirect } from "next/navigation";
import { AppShell } from "@/components/gamification/app-shell";
import { prisma } from "@/lib/prisma";
import { getTitleFromLevel } from "@/lib/level-utils";
import { processMissedStreakDays } from "@/lib/streak-engine";

export async function AppShellLoader({
  userId,
  locale,
  children,
}: {
  userId: string;
  locale: string;
  children: React.ReactNode;
}) {
  const [, profile, overallStreak] = await Promise.all([
    processMissedStreakDays(userId),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.streak.findFirst({ where: { userId, habitId: null } }),
  ]);

  if (profile?.preferredLanguage && profile.preferredLanguage !== locale) {
    redirect(`/${profile.preferredLanguage}/dashboard`);
  }

  return (
    <AppShell
      key={`${profile?.name ?? "player"}-${profile?.currentXP ?? 0}-${profile?.xpToNextLevel ?? 500}-${profile?.level ?? 1}-${profile?.avatarStyle ?? "default"}-${overallStreak?.currentStreak ?? 0}-${overallStreak?.freezesAvailable ?? 0}`}
      playerName={profile?.name ?? null}
      playerLevel={profile?.level ?? 1}
      playerTitle={getTitleFromLevel(profile?.level ?? 1)}
      currentXP={profile?.currentXP ?? 0}
      xpToNextLevel={profile?.xpToNextLevel ?? 500}
      avatarStyle={profile?.avatarStyle ?? null}
      streakDays={overallStreak?.currentStreak ?? 0}
      freezesAvailable={overallStreak?.freezesAvailable ?? 0}
    >
      {children}
    </AppShell>
  );
}

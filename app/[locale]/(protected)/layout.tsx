import { redirect } from "next/navigation";
import { AppShell } from "@/components/gamification/app-shell";
import { prisma } from "@/lib/prisma";
import { getTitleFromLevel } from "@/lib/level-utils";
import { processMissedStreakDays } from "@/lib/streak-engine";
import { getViewerContext } from "@/lib/viewer";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect(`/${locale}/auth/login`);
  }

  await processMissedStreakDays(viewer.userId);

  const [profile, overallStreak] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: viewer.userId } }),
    prisma.streak.findFirst({ where: { userId: viewer.userId, habitId: null } }),
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
    >
      {children}
    </AppShell>
  );
}

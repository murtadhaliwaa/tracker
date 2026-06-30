import { redirect } from "next/navigation";
import { AppShell } from "@/components/gamification/app-shell";
import { getTitleFromLevel } from "@/lib/level-utils";
import { getShellProfile } from "@/lib/page-data/shell-profile";
import { getShellStreak } from "@/lib/page-data/shell-streak";

export async function AppShellLoader({
  userId,
  locale,
  children,
}: {
  userId: string;
  locale: string;
  children: React.ReactNode;
}) {
  const [profile, overallStreak] = await Promise.all([
    getShellProfile(userId),
    getShellStreak(userId),
  ]);

  if (profile?.preferredLanguage && profile.preferredLanguage !== locale) {
    redirect(`/${profile.preferredLanguage}/dashboard`);
  }

  return (
    <AppShell
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

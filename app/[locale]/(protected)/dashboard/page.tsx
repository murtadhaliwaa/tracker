import { getTranslations } from "next-intl/server";
import { getViewerContext } from "@/lib/viewer";
import { getDashboardPageData } from "@/lib/page-data/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ShellStreakSync } from "@/components/shared/shell-streak-sync";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const data = await getDashboardPageData(viewer.userId);

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          No dashboard data found yet. Run <code>npm run db:seed</code> or create habits from the Habits page.
        </section>
      </div>
    );
  }

  return (
    <>
      <ShellStreakSync streak={data.streak} freezesAvailable={data.freezesAvailable} />
      <DashboardClient
        title={t("title")}
        streak={data.streak}
        freezesAvailable={data.freezesAvailable}
        healthValue={data.healthBar?.currentHealth ?? 0}
        maxHealth={data.healthBar?.maxHealth ?? 5}
        level={data.profile?.level ?? 1}
        profileTitle={data.profile?.title ?? "Novice"}
        currentXP={data.profile?.currentXP ?? 0}
        xpToNextLevel={data.profile?.xpToNextLevel ?? 100}
        showOnboarding={data.showOnboarding}
        dailyHabits={data.dailyHabits}
        boss={data.boss}
        reflection={data.reflection}
      />
    </>
  );
}

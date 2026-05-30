import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { todayLogFilter } from "@/lib/habit-day";
import { refreshWeeklyBoss, toBossPayload } from "@/lib/weekly-boss";
import { PageLoading } from "@/components/ui/page-loading";

const DashboardClient = dynamic(
  () => import("@/components/dashboard/dashboard-client").then((mod) => mod.DashboardClient),
  {
    ssr: false,
    loading: () => <PageLoading variant="dashboard" />,
  },
);

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const todayFilter = todayLogFilter();

  const [user, boss] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewer.userId },
      include: {
        profile: true,
        healthBar: true,
        reflections: { where: { type: "DAILY" }, orderBy: { createdAt: "desc" }, take: 1 },
        habits: {
          where: { period: "DAILY", isArchived: false },
          orderBy: { order: "asc" },
          include: {
            streak: true,
            logs: { where: todayFilter, take: 1 },
          },
        },
        streaks: { where: { habitId: null }, take: 1 },
        _count: { select: { habits: { where: { isArchived: false } } } },
      },
    }),
    refreshWeeklyBoss(viewer.userId),
  ]);

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          No dashboard data found yet. Run <code>npm run db:seed</code> or create habits from the Habits page.
        </section>
      </div>
    );
  }

  const reflection = user.reflections[0];
  const overallStreak = user.streaks[0];
  const habitCount = user._count.habits;
  const showOnboarding =
    !user.profile?.onboardingComplete &&
    (user.profile?.totalXP ?? 0) === 0 &&
    habitCount === 0;

  return (
    <DashboardClient
      title={t("title")}
      streak={overallStreak?.currentStreak ?? 0}
      freezesAvailable={overallStreak?.freezesAvailable ?? 0}
      healthValue={user.healthBar?.currentHealth ?? 0}
      maxHealth={user.healthBar?.maxHealth ?? 5}
      level={user.profile?.level ?? 1}
      profileTitle={user.profile?.title ?? "Novice"}
      currentXP={user.profile?.currentXP ?? 0}
      xpToNextLevel={user.profile?.xpToNextLevel ?? 100}
      showOnboarding={showOnboarding}
      dailyHabits={user.habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        xpValue: habit.xpValue,
        icon: habit.icon,
        color: habit.color,
        logType: habit.logType,
        currentStreak: habit.streak?.currentStreak ?? 0,
        completed: habit.logs.length > 0,
      }))}
      boss={toBossPayload(boss)}
      reflection={
        reflection
          ? {
              highlight: (reflection.answers as { highlight?: string }).highlight ?? "—",
              date: reflection.createdAt.toLocaleDateString(),
            }
          : null
      }
    />
  );
}

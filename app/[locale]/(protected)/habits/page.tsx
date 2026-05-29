import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { todayLogFilter } from "@/lib/habit-day";
import type { HabitClientItem } from "@/components/habits/habits-client";
import type { HabitFrequency } from "@/lib/habit-display";
import { PageLoading } from "@/components/ui/page-loading";

const HabitsClient = dynamic(
  () => import("@/components/habits/habits-client").then((mod) => mod.HabitsClient),
  {
    ssr: false,
    loading: () => <PageLoading variant="habits" />,
  },
);

export default async function HabitsPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const todayFilter = todayLogFilter();

  const [habits, categories] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: viewer.userId },
      orderBy: [{ period: "asc" }, { order: "asc" }],
      include: {
        streak: true,
        logs: {
          where: todayFilter,
          take: 1,
        },
      },
    }),
    prisma.habitCategory.findMany({
      where: { userId: viewer.userId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  const serialized: HabitClientItem[] = habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    description: habit.description,
    period: habit.period,
    xpValue: habit.xpValue,
    icon: habit.icon,
    color: habit.color,
    logType: habit.logType,
    isArchived: habit.isArchived,
    order: habit.order,
    category: habit.category,
    frequency: habit.frequency as HabitFrequency | null,
    currentStreak: habit.streak?.currentStreak ?? 0,
    completedToday: habit.logs.length > 0,
  }));

  return <HabitsClient habits={serialized} categories={categories.map((c) => c.name)} />;
}

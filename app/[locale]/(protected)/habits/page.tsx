import { getViewerContext } from "@/lib/viewer";
import { getHabitsPageData } from "@/lib/page-data/habits";
import { HabitsClient } from "@/components/habits/habits-client";
import { ShellStreakSync } from "@/components/shared/shell-streak-sync";

export default async function HabitsPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const { habits, categories, streak, freezesAvailable } = await getHabitsPageData(viewer.userId);

  return (
    <>
      <ShellStreakSync streak={streak} freezesAvailable={freezesAvailable} />
      <HabitsClient habits={habits} categories={categories} />
    </>
  );
}

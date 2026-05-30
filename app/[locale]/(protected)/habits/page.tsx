import { getViewerContext } from "@/lib/viewer";
import { getHabitsPageData } from "@/lib/page-data/habits";
import { HabitsClient } from "@/components/habits/habits-client";

export default async function HabitsPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const { habits, categories } = await getHabitsPageData(viewer.userId);

  return <HabitsClient habits={habits} categories={categories} />;
}

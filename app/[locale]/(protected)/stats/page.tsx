import { getViewerContext } from "@/lib/viewer";
import { getStatsPageData } from "@/lib/page-data/stats";
import { StatsClient } from "@/components/charts/stats-client";

export default async function StatsPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const data = await getStatsPageData(viewer.userId);

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <StatsClient {...data} />
    </div>
  );
}

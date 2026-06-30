import { getViewerContext } from "@/lib/viewer";
import { getMindPageData } from "@/lib/page-data/mind";
import { MindClient } from "@/components/mind/mind-client";

export default async function MindPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const data = await getMindPageData(viewer.userId);

  return <MindClient {...data} />;
}

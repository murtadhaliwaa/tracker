import { getViewerContext } from "@/lib/viewer";
import { getSettingsPageData } from "@/lib/page-data/settings";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const data = await getSettingsPageData(viewer.userId, locale);

  return <SettingsClient {...data} />;
}

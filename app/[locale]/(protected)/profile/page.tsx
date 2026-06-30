import { getViewerContext } from "@/lib/viewer";
import { getProfilePageData } from "@/lib/page-data/profile";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const data = await getProfilePageData(viewer.userId);

  return <ProfileClient {...data} />;
}

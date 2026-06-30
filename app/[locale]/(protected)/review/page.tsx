import { getViewerContext } from "@/lib/viewer";
import { getReviewPageData } from "@/lib/page-data/review";
import { ReviewClient } from "@/components/review/review-client";

export default async function ReviewPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const reviews = await getReviewPageData(viewer.userId);

  return <ReviewClient reviews={reviews} />;
}

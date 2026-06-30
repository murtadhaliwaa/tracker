import { getViewerContext } from "@/lib/viewer";
import { getCoursesPageData } from "@/lib/page-data/courses";
import { ensureMissingCourseLessons } from "@/app/[locale]/(protected)/courses/actions";
import { CoursesClient } from "@/components/courses/courses-client";

export default async function CoursesPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const courses = await getCoursesPageData(viewer.userId);

  const needingLessons = courses.filter((c) => c.lessons.length < c.totalLessons);
  if (needingLessons.length > 0) {
    void ensureMissingCourseLessons(
      needingLessons.map((c) => ({
        id: c.id,
        totalLessons: c.totalLessons,
      })),
    ).catch(() => undefined);
  }

  return <CoursesClient courses={courses} />;
}

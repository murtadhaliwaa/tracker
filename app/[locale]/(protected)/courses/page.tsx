import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { ensureCourseLessons } from "@/lib/course-lessons";
import { CoursesClient } from "@/components/courses/courses-client";

export default async function CoursesPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  let courses = await prisma.course.findMany({
    where: { userId: viewer.userId },
    include: {
      lessons: { orderBy: { lessonNumber: "asc" } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const coursesNeedingLessons = courses.filter(
    (course) => course.lessons.length < course.totalLessons,
  );

  if (coursesNeedingLessons.length > 0) {
    await Promise.all(
      coursesNeedingLessons.map((course) =>
        ensureCourseLessons(course.id, viewer.userId, course.totalLessons),
      ),
    );

    const refreshed = await prisma.course.findMany({
      where: { id: { in: coursesNeedingLessons.map((c) => c.id) } },
      include: {
        lessons: { orderBy: { lessonNumber: "asc" } },
      },
    });

    const refreshedById = new Map(refreshed.map((course) => [course.id, course]));
    courses = courses.map((course) => refreshedById.get(course.id) ?? course);
  }

  return (
    <CoursesClient
      courses={courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        icon: course.icon,
        totalLessons: course.totalLessons,
        completedLessons: course.completedLessons,
        xpReward: course.xpReward,
        lessons: course.lessons.map((l) => ({
          id: l.id,
          lessonNumber: l.lessonNumber,
          title: l.title,
          isCompleted: l.isCompleted,
        })),
      }))}
    />
  );
}

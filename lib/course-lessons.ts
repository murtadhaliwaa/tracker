import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export async function ensureCourseLessons(
  courseId: string,
  userId: string,
  totalLessons: number,
  client: Tx | typeof prisma = prisma,
) {
  const existing = await client.courseLesson.count({ where: { courseId } });
  if (existing >= totalLessons) return;

  const toCreate = [];
  for (let n = existing + 1; n <= totalLessons; n++) {
    toCreate.push({
      userId,
      courseId,
      lessonNumber: n,
      title: `Lesson ${n}`,
    });
  }

  if (toCreate.length > 0) {
    await client.courseLesson.createMany({ data: toCreate });
  }
}

export async function syncCourseCompletedCount(courseId: string, client: Tx | typeof prisma = prisma) {
  const completed = await client.courseLesson.count({
    where: { courseId, isCompleted: true },
  });
  await client.course.update({
    where: { id: courseId },
    data: { completedLessons: completed },
  });
  return completed;
}

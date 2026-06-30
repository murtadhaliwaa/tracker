import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type CourseLessonRow = {
  id: string;
  lessonNumber: number;
  title: string;
  isCompleted: boolean;
};

export type CourseClientRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string;
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  lessons: CourseLessonRow[];
};

export const getCoursesPageData = cache(async (userId: string): Promise<CourseClientRow[]> => {
  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      icon: true,
      totalLessons: true,
      completedLessons: true,
      xpReward: true,
      lessons: {
        orderBy: { lessonNumber: "asc" },
        select: {
          id: true,
          lessonNumber: true,
          title: true,
          isCompleted: true,
        },
      },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    icon: course.icon,
    totalLessons: course.totalLessons,
    completedLessons: course.completedLessons,
    xpReward: course.xpReward,
    lessons: course.lessons,
  }));
});

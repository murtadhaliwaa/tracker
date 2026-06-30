import { cache } from "react";
import { prisma } from "@/lib/prisma";

const courseSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  icon: true,
  totalLessons: true,
  completedLessons: true,
  xpReward: true,
  lessons: {
    orderBy: { lessonNumber: "asc" as const },
    select: {
      id: true,
      lessonNumber: true,
      title: true,
      isCompleted: true,
    },
  },
} as const;

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

type CourseDbRow = {
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

export function toCourseClientRow(course: CourseDbRow): CourseClientRow {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    icon: course.icon,
    totalLessons: course.totalLessons,
    completedLessons: course.completedLessons,
    xpReward: course.xpReward,
    lessons: course.lessons,
  };
}

export async function fetchCourseClientRow(userId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
    select: courseSelect,
  });
  if (!course) throw new Error("Course not found");
  return toCourseClientRow(course);
}

export const getCoursesPageData = cache(async (userId: string): Promise<CourseClientRow[]> => {
  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: courseSelect,
  });

  return courses.map(toCourseClientRow);
});

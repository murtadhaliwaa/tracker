import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiViewer, isNextResponse, badRequestResponse, notFoundResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { completeCourseLesson } from "@/lib/complete-course-lesson";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  lessonId: z.string().cuid(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id: courseId } = await context.params;

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: viewer.userId },
    });
    if (!course) return notFoundResponse("Course not found");

    const result = await completeCourseLesson(viewer.userId, courseId, parsed.lessonId);

    const lessons = await prisma.courseLesson.findMany({
      where: { courseId },
      orderBy: { lessonNumber: "asc" },
    });

    return NextResponse.json({
      ...result,
      course: {
        ...course,
        completedLessons: result.completedLessons,
        lessons,
      },
    });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

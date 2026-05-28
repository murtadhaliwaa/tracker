import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse, notFoundResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateCourseSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateCourseSchema.parse({ ...body, id });

    const result = await prisma.course.updateMany({
      where: { id: parsed.id, userId: viewer.userId },
      data: {
        title: parsed.title,
        provider: parsed.provider,
        totalLessons: parsed.totalLessons,
        difficulty: parsed.difficulty,
        priority: parsed.priority,
        xpReward: parsed.xpReward,
        prerequisiteCourseId: parsed.prerequisiteCourseId ?? null,
      },
    });

    if (result.count === 0) return notFoundResponse("Course not found");
    return NextResponse.json({ success: true });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;
  const result = await prisma.course.deleteMany({ where: { id, userId: viewer.userId } });
  if (result.count === 0) return notFoundResponse("Course not found");
  return NextResponse.json({ success: true });
}

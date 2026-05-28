import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { courseFormSchema } from "@/lib/validators";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const courses = await prisma.course.findMany({
    where: { userId: viewer.userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ courses });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const parsed = courseFormSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        userId: viewer.userId,
        title: parsed.title,
        provider: parsed.provider,
        totalLessons: parsed.totalLessons,
        difficulty: parsed.difficulty,
        priority: parsed.priority,
        xpReward: parsed.xpReward,
        prerequisiteCourseId: parsed.prerequisiteCourseId ?? null,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

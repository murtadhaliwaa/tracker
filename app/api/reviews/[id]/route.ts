import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse, notFoundResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateWeeklyReviewSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateWeeklyReviewSchema.parse({ ...body, id });

    const result = await prisma.reflection.updateMany({
      where: { id: parsed.id, userId: viewer.userId, type: "WEEKLY" },
      data: {
        answers: {
          weekRating: parsed.weekRating,
          winOfWeek: parsed.winOfWeek,
          challengeFaced: parsed.challengeFaced,
          lessonLearned: parsed.lessonLearned,
          nextWeekGoal: parsed.nextWeekGoal,
        },
      },
    });

    if (result.count === 0) return notFoundResponse("Review not found");

    const reflection = await prisma.reflection.findFirst({
      where: { id: parsed.id, userId: viewer.userId },
    });

    return NextResponse.json({ reflection });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

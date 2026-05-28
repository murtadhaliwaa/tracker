import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { weeklyReviewSchema } from "@/lib/validators";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const reviews = await prisma.reflection.findMany({
    where: { userId: viewer.userId, type: "WEEKLY" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const parsed = weeklyReviewSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const reflection = await tx.reflection.create({
        data: {
          userId: viewer.userId,
          type: "WEEKLY",
          answers: {
            weekRating: parsed.weekRating,
            winOfWeek: parsed.winOfWeek,
            challengeFaced: parsed.challengeFaced,
            lessonLearned: parsed.lessonLearned,
            nextWeekGoal: parsed.nextWeekGoal,
          },
        },
      });

      const xpResult = await awardXP(tx, viewer.userId, 20, "weekly_review", 1);
      const unlockedAchievements = await checkAndUnlockAchievements(viewer.userId, tx);
      return { reflection, ...xpResult, unlockedAchievements };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { awardXP } from "@/lib/xp";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { updateWeeklyReviewSchema, weeklyReviewSchema } from "@/lib/validators";

const REVIEW_XP = 50;

function revalidateReviewPages() {
  revalidateLocalePaths("/review");
}

function toAnswers(parsed: {
  weekRating: number;
  winOfWeek: string;
  challengeFaced: string;
  lessonLearned: string;
  nextWeekGoal: string;
}) {
  return {
    weekRating: parsed.weekRating,
    winOfWeek: parsed.winOfWeek,
    challengeFaced: parsed.challengeFaced,
    lessonLearned: parsed.lessonLearned,
    nextWeekGoal: parsed.nextWeekGoal,
  };
}

export async function createWeeklyReview(input: unknown) {
  const viewer = await requireViewer();
  const parsed = weeklyReviewSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const reflection = await tx.reflection.create({
      data: {
        userId: viewer.userId,
        type: "WEEKLY",
        answers: toAnswers(parsed),
      },
    });

    const xpResult = await awardXP(tx, viewer.userId, REVIEW_XP, "weekly_review", 1);
    return { reflection, ...xpResult };
  });

  void checkAndUnlockAchievements(viewer.userId).catch(() => undefined);
  revalidateReviewPages();
  return {
    review: {
      id: result.reflection.id,
      createdAt: result.reflection.createdAt.toISOString(),
      weekRating: parsed.weekRating,
      winOfWeek: parsed.winOfWeek,
      challengeFaced: parsed.challengeFaced,
      lessonLearned: parsed.lessonLearned,
      nextWeekGoal: parsed.nextWeekGoal,
    },
    xpAwarded: result.xpAwarded,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    newTitle: result.newTitle,
    currentXP: result.currentXP,
    xpToNextLevel: result.xpToNextLevel,
  };
}

export async function updateWeeklyReview(input: unknown) {
  const viewer = await requireViewer();
  const parsed = updateWeeklyReviewSchema.parse(input);

  await prisma.reflection.updateMany({
    where: { id: parsed.id, userId: viewer.userId, type: "WEEKLY" },
    data: { answers: toAnswers(parsed) },
  });

  revalidateReviewPages();
  return { success: true as const };
}

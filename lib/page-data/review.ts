import { cache } from "react";
import { prisma } from "@/lib/prisma";

type ReviewAnswers = {
  weekRating?: number;
  winOfWeek?: string;
  challengeFaced?: string;
  lessonLearned?: string;
  nextWeekGoal?: string;
  q1?: string;
  q2?: string;
  q3?: string;
};

export type ReviewClientRow = {
  id: string;
  createdAt: string;
  weekRating: number;
  winOfWeek: string;
  challengeFaced: string;
  lessonLearned: string;
  nextWeekGoal: string;
};

function mapReview(review: { id: string; createdAt: Date; answers: unknown }): ReviewClientRow {
  const answers = review.answers as ReviewAnswers;
  return {
    id: review.id,
    createdAt: review.createdAt.toISOString(),
    weekRating: answers.weekRating ?? 3,
    winOfWeek: answers.winOfWeek ?? answers.q1 ?? "",
    challengeFaced: answers.challengeFaced ?? answers.q2 ?? "",
    lessonLearned: answers.lessonLearned ?? "",
    nextWeekGoal: answers.nextWeekGoal ?? answers.q3 ?? "",
  };
}

export const getReviewPageData = cache(async (userId: string): Promise<ReviewClientRow[]> => {
  const reviews = await prisma.reflection.findMany({
    where: { userId, type: "WEEKLY" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, answers: true },
  });

  return reviews.map(mapReview);
});

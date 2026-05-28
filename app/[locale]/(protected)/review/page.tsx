import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { ReviewClient } from "@/components/review/review-client";

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

export default async function ReviewPage() {
  const viewer = await getViewerContext();
  if (!viewer) return <div className="text-sm text-foreground/70">No user context found.</div>;

  const reviews = await prisma.reflection.findMany({
    where: { userId: viewer.userId, type: "WEEKLY" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReviewClient
      reviews={reviews.map((review) => {
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
      })}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { syncWeeklyBossProgress } from "@/lib/weekly-boss";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { syncCourseCompletedCount } from "@/lib/course-lessons";

const LESSON_XP = 100;
const COURSE_COMPLETE_BONUS = 200;

export async function completeCourseLesson(userId: string, courseId: string, lessonId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.findFirst({
      where: { id: lessonId, courseId, userId },
      include: { course: true },
    });
    if (!lesson) throw new Error("Lesson not found");
    if (lesson.isCompleted) {
      const completedLessons = await syncCourseCompletedCount(lesson.courseId, tx);
      return {
        alreadyCompleted: true,
        completedLessons,
        totalLessons: lesson.course.totalLessons,
        isComplete: completedLessons >= lesson.course.totalLessons,
        xpAwarded: 0,
        leveledUp: false,
        newLevel: 0,
        newTitle: "",
        bonusXpAwarded: 0,
        unlockedAchievements: [] as string[],
      };
    }

    await tx.courseLesson.update({
      where: { id: lesson.id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    const completedLessons = await syncCourseCompletedCount(lesson.courseId, tx);
    const isComplete = completedLessons >= lesson.course.totalLessons;

    const lessonXpResult = await awardXP(tx, userId, LESSON_XP, "lesson_completion", 1);

    let bonusXpAwarded = 0;
    let leveledUp = lessonXpResult.leveledUp;
    let newLevel = lessonXpResult.newLevel;
    let newTitle = lessonXpResult.newTitle;
    if (isComplete) {
      const bonusXpResult = await awardXP(tx, userId, COURSE_COMPLETE_BONUS, "course_completion", 1);
      bonusXpAwarded = bonusXpResult.xpAwarded;
      leveledUp = leveledUp || bonusXpResult.leveledUp;
      newLevel = bonusXpResult.leveledUp ? bonusXpResult.newLevel : newLevel;
      newTitle = bonusXpResult.leveledUp ? bonusXpResult.newTitle : newTitle;
    }

    return {
      alreadyCompleted: false,
      completedLessons,
      totalLessons: lesson.course.totalLessons,
      isComplete,
      xpAwarded: lessonXpResult.xpAwarded + bonusXpAwarded,
      lessonXpAwarded: LESSON_XP,
      bonusXpAwarded,
      leveledUp,
      newLevel,
      newTitle,
      unlockedAchievements: [] as string[],
      currentXP: lessonXpResult.currentXP,
      xpToNextLevel: lessonXpResult.xpToNextLevel,
      totalXP: lessonXpResult.totalXP,
    };
  });

  if (result.isComplete) {
    void checkAndUnlockAchievements(userId).catch(() => undefined);
  }

  const bossResult = await syncWeeklyBossProgress(userId);

  return {
    ...result,
    boss: {
      currentValue: bossResult.boss.currentValue,
      targetValue: bossResult.boss.targetValue,
      isCompleted: bossResult.boss.isCompleted,
      title: bossResult.boss.title,
      description: bossResult.boss.description,
      xpReward: bossResult.boss.xpReward,
    },
  };
}

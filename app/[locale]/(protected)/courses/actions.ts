"use server";

import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { awardXP } from "@/lib/xp";
import { syncWeeklyBossProgress } from "@/lib/weekly-boss";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { ensureCourseLessons, syncCourseCompletedCount } from "@/lib/course-lessons";
import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { courseFormSchema, updateCourseSchema } from "@/lib/validators";

const LESSON_XP = 100;
const COURSE_COMPLETE_BONUS = 200;

function revalidateCourses(includeDashboard = false) {
  revalidateLocalePaths("/courses", ...(includeDashboard ? ["/dashboard"] as const : []));
}

export async function createCourse(input: unknown) {
  const viewer = await requireViewer();
  const parsed = courseFormSchema.parse(input);

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        userId: viewer.userId,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        icon: parsed.icon ?? "📚",
        provider: parsed.category ?? parsed.provider,
        totalLessons: parsed.totalLessons,
        difficulty: parsed.difficulty ?? 3,
        priority: parsed.priority ?? 5,
        xpReward: parsed.xpReward ?? 200,
        prerequisiteCourseId: parsed.prerequisiteCourseId ?? null,
      },
    });
    await ensureCourseLessons(created.id, viewer.userId, parsed.totalLessons, tx);
    return created;
  });

  revalidateCourses();
  return { success: true as const, courseId: course.id };
}

export async function updateCourse(input: unknown) {
  const viewer = await requireViewer();
  const parsed = updateCourseSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.course.updateMany({
      where: { id: parsed.id, userId: viewer.userId },
      data: {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        icon: parsed.icon ?? "📚",
        provider: parsed.category ?? parsed.provider,
        totalLessons: parsed.totalLessons,
        difficulty: parsed.difficulty ?? 3,
        priority: parsed.priority ?? 5,
        xpReward: parsed.xpReward ?? 200,
        prerequisiteCourseId: parsed.prerequisiteCourseId ?? null,
      },
    });
    await ensureCourseLessons(parsed.id, viewer.userId, parsed.totalLessons, tx);
    await syncCourseCompletedCount(parsed.id, tx);
  });

  revalidateCourses();
  return { success: true as const };
}

export async function deleteCourse(courseId: string) {
  const viewer = await requireViewer();
  await prisma.course.deleteMany({ where: { id: courseId, userId: viewer.userId } });
  revalidateCourses();
  return { success: true as const };
}

export async function toggleLessonComplete(lessonId: string) {
  const viewer = await requireViewer();

  const result = await prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.findFirst({
      where: { id: lessonId, userId: viewer.userId },
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

    const lessonXpResult = await awardXP(tx, viewer.userId, LESSON_XP, "lesson_completion", 1);

    let bonusXpAwarded = 0;
    let leveledUp = lessonXpResult.leveledUp;
    let newLevel = lessonXpResult.newLevel;
    let newTitle = lessonXpResult.newTitle;

    if (isComplete) {
      const bonusXpResult = await awardXP(tx, viewer.userId, COURSE_COMPLETE_BONUS, "course_completion", 1);
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
      currentXP: lessonXpResult.currentXP,
      xpToNextLevel: lessonXpResult.xpToNextLevel,
      unlockedAchievements: [] as string[],
    };
  });

  void checkAndUnlockAchievements(viewer.userId).catch(() => undefined);
  const bossResult = await syncWeeklyBossProgress(viewer.userId);

  revalidateCourses(true);
  return {
    ...result,
    bossCurrentValue: bossResult.boss.currentValue,
    bossTargetValue: bossResult.boss.targetValue,
    bossIsCompleted: bossResult.boss.isCompleted,
  };
}

/** @deprecated Use toggleLessonComplete */
export async function markLessonComplete(courseId: string) {
  const viewer = await requireViewer();
  await ensureCourseLessons(courseId, viewer.userId, (
    await prisma.course.findFirst({ where: { id: courseId, userId: viewer.userId } })
  )?.totalLessons ?? 0);

  const nextLesson = await prisma.courseLesson.findFirst({
    where: { courseId, userId: viewer.userId, isCompleted: false },
    orderBy: { lessonNumber: "asc" },
  });
  if (!nextLesson) throw new Error("No lessons remaining");
  return toggleLessonComplete(nextLesson.id);
}

export async function ensureMissingCourseLessons(
  courses: { id: string; totalLessons: number }[],
) {
  const viewer = await requireViewer();
  if (courses.length === 0) return;

  await Promise.all(
    courses.map((course) =>
      ensureCourseLessons(course.id, viewer.userId, course.totalLessons),
    ),
  );
}

"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { patchShellFromAward } from "@/lib/shell-stats-client";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { getCourseCategoryLabel, getCourseCategoryLabels } from "@/lib/course-display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { CourseFormDialog, type CourseFormValues } from "@/components/courses/course-form-dialog";

type LessonItem = {
  id: string;
  lessonNumber: number;
  title: string;
  isCompleted: boolean;
};

type CourseItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string;
  totalLessons: number;
  completedLessons: number;
  xpReward: number;
  lessons: LessonItem[];
};

type Props = {
  courses: CourseItem[];
};

type LessonPatchResult = {
  alreadyCompleted: boolean;
  completedLessons: number;
  totalLessons: number;
  isComplete: boolean;
  xpAwarded: number;
  bonusXpAwarded: number;
  leveledUp: boolean;
  newLevel: number;
  newTitle: string;
  course: CourseItem;
  boss: {
    currentValue: number;
    targetValue: number;
    isCompleted: boolean;
  };
};

export function CoursesClient({ courses: initialCourses }: Props) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const categoryLabels = useMemo(() => getCourseCategoryLabels(t), [t]);
  const [pending, startTransition] = useTransition();
  const [courses, setCourses] = useState(initialCourses);
  const [formOpen, setFormOpen] = useState(false);
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<{ title: string; xp: number } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const detailCourse = courses.find((c) => c.id === detailCourseId) ?? null;

  const saveCourse = (form: CourseFormValues) => {
    if (!form.title || !form.category || form.totalLessons < 1) return;
    startTransition(async () => {
      try {
        const data = await apiFetch<{ course: CourseItem }>("/api/courses", {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            description: form.description || undefined,
            category: form.category,
            icon: form.icon,
            totalLessons: form.totalLessons,
          }),
        });
        setCourses((prev) => [data.course, ...prev]);
        toast.success(t("created"));
        setFormOpen(false);
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleLessonToggle = (courseId: string, lessonId: string) => {
    const snapshot = courses;
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const lessons = c.lessons.map((l) =>
          l.id === lessonId ? { ...l, isCompleted: true } : l,
        );
        const completedLessons = lessons.filter((l) => l.isCompleted).length;
        return { ...c, lessons, completedLessons };
      }),
    );

    startTransition(async () => {
      try {
        const result = await apiFetch<LessonPatchResult>(`/api/courses/${courseId}/lessons`, {
          method: "PATCH",
          body: JSON.stringify({ lessonId }),
        });

        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? result.course : c)),
        );

        if (result.alreadyCompleted) return;

        if (result.isComplete) {
          const courseTitle = courses.find((c) => c.id === courseId)?.title ?? "";
          setCelebrate({ title: courseTitle, xp: result.bonusXpAwarded });
          patchShellFromAward(result);
          if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        } else {
          toast.success(tc("xpAwarded", { xp: result.xpAwarded }));
          patchShellFromAward(result);
        }

        window.dispatchEvent(
          new CustomEvent("boss-updated", {
            detail: result.boss,
          }),
        );
      } catch {
        toast.error(tc("error"));
        setCourses(snapshot);
      }
    });
  };

  return (
    <div className="space-y-5">
      <LevelUpModal
        open={Boolean(levelUp)}
        onOpenChange={() => setLevelUp(null)}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
      />

      <RPGPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button
            type="button"
            variant="outline"
            className="border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)]"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="size-4" />
            {t("addCourse")}
          </Button>
        }
      />

      {courses.length === 0 ? (
        <RPGCard glow="blue" className="p-6 text-center">
          <p className="text-rpg-secondary">{t("empty")}</p>
        </RPGCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const progress = course.totalLessons
            ? Math.round((course.completedLessons / course.totalLessons) * 100)
            : 0;

          return (
            <RPGCard key={course.id} glow="blue" className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] text-2xl">
                  {course.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base text-rpg-text">{course.title}</p>
                  {course.category ? (
                    <span className="mt-1.5 inline-block rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-2 py-0.5 text-[11px] text-[#7C3AED]">
                      {getCourseCategoryLabel(course.category, categoryLabels)}
                    </span>
                  ) : null}
                  <p className="mt-2 text-xs text-rpg-secondary">
                    {course.completedLessons} / {course.totalLessons} {t("lessons")}
                  </p>
                  <div className="mt-2 h-[6px] w-full overflow-hidden rounded-[3px] bg-[#1e1e3a]">
                    <div
                      className="h-full rounded-[3px] bg-gradient-to-r from-[#7C3AED] to-[#D4AF37]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#D4AF37]">+{course.xpReward} XP</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-[#7C3AED] text-[#7C3AED]"
                      onClick={() => setDetailCourseId(course.id)}
                    >
                      {t("viewLessons")}
                    </Button>
                  </div>
                </div>
              </div>
            </RPGCard>
          );
        })}
      </div>

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pending={pending}
        onSubmit={saveCourse}
      />

      <Dialog open={Boolean(detailCourse)} onOpenChange={() => setDetailCourseId(null)}>
        {detailCourse ? (
          <DialogContent className="max-h-[85vh] overflow-y-auto border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{detailCourse.icon}</span>
                {detailCourse.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {detailCourse.lessons.map((lesson) => (
                <label
                  key={lesson.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-[#1e1e3a] bg-[#13131f] px-3 py-2 transition",
                    lesson.isCompleted && "border-rpg-green/40 bg-rpg-green/5",
                  )}
                >
                  <Checkbox
                    checked={lesson.isCompleted}
                    disabled={pending || lesson.isCompleted}
                    onCheckedChange={() => {
                      if (!lesson.isCompleted) {
                        handleLessonToggle(detailCourse.id, lesson.id);
                      }
                    }}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      lesson.isCompleted && "text-rpg-green line-through",
                    )}
                  >
                    {lesson.title}
                  </span>
                  {lesson.isCompleted ? <Check className="size-4 text-rpg-green" /> : null}
                </label>
              ))}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(celebrate)} onOpenChange={() => setCelebrate(null)}>
        {celebrate ? (
          <DialogContent className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-center text-[#D4AF37]">{t("courseCompleteTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-center font-heading text-rpg-text">{celebrate.title}</p>
            <p className="text-center text-sm text-rpg-secondary">
              {t("courseCompleteBanner", { xp: celebrate.xp })}
            </p>
            <Button type="button" className="mt-2 w-full" onClick={() => setCelebrate(null)}>
              {tc("continue")}
            </Button>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

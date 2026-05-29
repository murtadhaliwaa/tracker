"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { Pencil, Plus, Sparkles, Star } from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import {
  WeeklyReviewDialog,
  type ReviewFormValues,
} from "@/components/review/weekly-review-dialog";

type ReviewItem = {
  id: string;
  createdAt: string;
  weekRating: number;
  winOfWeek: string;
  challengeFaced: string;
  lessonLearned: string;
  nextWeekGoal: string;
};

type Props = {
  reviews: ReviewItem[];
};

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(!readonly && "cursor-pointer")}
        >
          <Star
            className={cn(
              "size-5",
              star <= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-rpg-border",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function parseReview(reflection: {
  id: string;
  createdAt: string;
  answers: Record<string, unknown>;
}): ReviewItem {
  const a = reflection.answers;
  return {
    id: reflection.id,
    createdAt: reflection.createdAt,
    weekRating: (a.weekRating as number) ?? 3,
    winOfWeek: (a.winOfWeek as string) ?? (a.q1 as string) ?? "",
    challengeFaced: (a.challengeFaced as string) ?? (a.q2 as string) ?? "",
    lessonLearned: (a.lessonLearned as string) ?? "",
    nextWeekGoal: (a.nextWeekGoal as string) ?? (a.q3 as string) ?? "",
  };
}

export function ReviewClient({ reviews: initialReviews }: Props) {
  const t = useTranslations("review");
  const tc = useTranslations("common");
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [editForm, setEditForm] = useState<ReviewFormValues | null>(null);

  const openEdit = (review: ReviewItem) => {
    setEditForm({
      id: review.id,
      weekRating: review.weekRating,
      winOfWeek: review.winOfWeek,
      challengeFaced: review.challengeFaced,
      lessonLearned: review.lessonLearned,
      nextWeekGoal: review.nextWeekGoal,
    });
    setOpen(true);
  };

  const fields = [
    { key: "winOfWeek" as const, label: t("fields.winOfWeek") },
    { key: "challengeFaced" as const, label: t("fields.challengeFaced") },
    { key: "lessonLearned" as const, label: t("fields.lessonLearned") },
    { key: "nextWeekGoal" as const, label: t("fields.nextWeekGoal") },
  ];

  const weekRangeLabel = (isoDate: string) => {
    const date = new Date(isoDate);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  const saveReview = (form: ReviewFormValues) => {
    startTransition(async () => {
      try {
        if (form.id) {
          await apiFetch(`/api/reviews/${form.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          });
          setReviews((prev) =>
            prev.map((r) =>
              r.id === form.id
                ? {
                    ...r,
                    weekRating: form.weekRating,
                    winOfWeek: form.winOfWeek,
                    challengeFaced: form.challengeFaced,
                    lessonLearned: form.lessonLearned,
                    nextWeekGoal: form.nextWeekGoal,
                  }
                : r,
            ),
          );
          toast.success(t("updated"));
        } else {
          const result = await apiFetch<{
            reflection: { id: string; createdAt: string; answers: Record<string, unknown> };
            xpAwarded: number;
            leveledUp: boolean;
            newLevel: number;
            newTitle: string;
          }>("/api/reviews", {
            method: "POST",
            body: JSON.stringify(form),
          });
          const item = parseReview({
            id: result.reflection.id,
            createdAt: result.reflection.createdAt,
            answers: result.reflection.answers,
          });
          setReviews((prev) => [item, ...prev]);
          toast.success(t("saved"));
          if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        }
        setOpen(false);
        setEditForm(null);
        router.refresh();
      } catch {
        toast.error(tc("error"));
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
            onClick={() => {
              setEditForm(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4 shrink-0" />
            <span className="sm:hidden">{t("writeReviewShort")}</span>
            <span className="hidden sm:inline">{t("writeReview")}</span>
          </Button>
        }
      />

      {reviews.length === 0 ? (
        <RPGCard glow="gold" className="p-6 text-center">
          <p className="text-rpg-secondary">{t("empty")}</p>
        </RPGCard>
      ) : null}

      <div className="relative pl-6">
        <div className="absolute left-2 top-0 h-full w-0.5 bg-[#D4AF37]/60" />
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="relative">
              <div className="absolute -left-[18px] top-3 size-3 rounded-full bg-[#D4AF37]" />
              <RPGCard glow="gold" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm text-[#D4AF37]">
                      {weekRangeLabel(review.createdAt)}
                    </p>
                    <div className="mt-2">
                      <StarRating value={review.weekRating} readonly />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(review)}>
                      <Pencil className="size-4" />
                      {t("edit")}
                    </Button>
                    <Sparkles className="size-5 text-[#D4AF37]" />
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {fields.map(({ key, label }) => (
                    <div key={key} className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
                      <p className="text-xs font-bold text-[#D4AF37]">{label}</p>
                      <p className="mt-1 text-rpg-text/90">{review[key]}</p>
                    </div>
                  ))}
                </div>
              </RPGCard>
            </div>
          ))}
        </div>
      </div>

      <WeeklyReviewDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setEditForm(null);
        }}
        pending={pending}
        initial={editForm}
        onSubmit={saveReview}
      />
    </div>
  );
}

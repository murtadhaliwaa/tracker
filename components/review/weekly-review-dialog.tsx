"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const REVIEW_ACCENT = "#D4AF37";

export type ReviewFormValues = {
  id?: string;
  weekRating: number;
  winOfWeek: string;
  challengeFaced: string;
  lessonLearned: string;
  nextWeekGoal: string;
};

export const emptyReviewForm = (): ReviewFormValues => ({
  weekRating: 3,
  winOfWeek: "",
  challengeFaced: "",
  lessonLearned: "",
  nextWeekGoal: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  initial?: ReviewFormValues | null;
  onSubmit: (form: ReviewFormValues) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star}`}
          onClick={() => onChange(star)}
          className="rounded-md p-0.5 transition hover:scale-105"
        >
          <Star
            className={cn(
              "size-6",
              star <= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-rpg-border",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function weekRangeLabel(): string {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

function getRatingLabels(t: (key: "ratingLabels.1" | "ratingLabels.2" | "ratingLabels.3" | "ratingLabels.4" | "ratingLabels.5") => string) {
  return {
    1: t("ratingLabels.1"),
    2: t("ratingLabels.2"),
    3: t("ratingLabels.3"),
    4: t("ratingLabels.4"),
    5: t("ratingLabels.5"),
  } as const;
}

export function WeeklyReviewDialog({ open, onOpenChange, pending, initial, onSubmit }: Props) {
  const t = useTranslations("review");
  const [form, setForm] = useState<ReviewFormValues>(emptyReviewForm());
  const ratingLabels = getRatingLabels(t);

  useEffect(() => {
    if (open) setForm(initial ?? emptyReviewForm());
  }, [open, initial]);

  const isValid =
    form.winOfWeek.trim().length > 0 &&
    form.challengeFaced.trim().length > 0 &&
    form.lessonLearned.trim().length > 0 &&
    form.nextWeekGoal.trim().length > 0;

  const previewText = form.winOfWeek.trim() || t("previewPlaceholder");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">
            {form.id ? t("editReview") : t("writeReview")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${REVIEW_ACCENT}66`,
              background: `linear-gradient(135deg, ${REVIEW_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: `${REVIEW_ACCENT}88`, background: "#0f0f1a" }}
            >
              <Sparkles className="size-6 text-rpg-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base text-rpg-text">{t("reviewHeading")}</p>
              <p className="mt-0.5 text-xs text-rpg-secondary">{weekRangeLabel()}</p>
              <div className="mt-2 flex items-center gap-2">
                <StarRating value={form.weekRating} onChange={(v) => setForm({ ...form, weekRating: v })} />
                <span className="text-xs text-rpg-secondary">
                  {ratingLabels[form.weekRating as 1 | 2 | 3 | 4 | 5]}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-rpg-text/80" dir="auto">
                {previewText}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionRating")}>
            <div>
              <Label>{t("fields.weekRating")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setForm({ ...form, weekRating: rating })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                      form.weekRating === rating
                        ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-gold/30",
                    )}
                  >
                    {rating} · {ratingLabels[rating as 1 | 2 | 3 | 4 | 5]}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection title={t("sectionReflection")}>
            <div>
              <Label htmlFor="review-win">{t("fields.winOfWeek")}</Label>
              <Textarea
                id="review-win"
                value={form.winOfWeek}
                onChange={(e) => setForm({ ...form, winOfWeek: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("questions.q1")}
              />
            </div>
            <div>
              <Label htmlFor="review-challenge">{t("fields.challengeFaced")}</Label>
              <Textarea
                id="review-challenge"
                value={form.challengeFaced}
                onChange={(e) => setForm({ ...form, challengeFaced: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("questions.q2")}
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionForward")}>
            <div>
              <Label htmlFor="review-lesson">{t("fields.lessonLearned")}</Label>
              <Textarea
                id="review-lesson"
                value={form.lessonLearned}
                onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("placeholders.lessonLearned")}
              />
            </div>
            <div>
              <Label htmlFor="review-goal">{t("fields.nextWeekGoal")}</Label>
              <Textarea
                id="review-goal"
                value={form.nextWeekGoal}
                onChange={(e) => setForm({ ...form, nextWeekGoal: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("questions.q3")}
              />
            </div>
          </FormSection>
        </div>

        <DialogFooter className="gap-2 border-t border-[#1e1e3a] bg-[#0c0c14] px-5 py-3 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button
            className="border-rpg-gold/40 bg-rpg-gold text-[#0a0a0f] hover:bg-rpg-gold/90"
            onClick={() => onSubmit(form)}
            disabled={pending || !isValid}
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

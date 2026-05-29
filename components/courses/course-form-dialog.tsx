"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  COURSE_ACCENT,
  COURSE_CATEGORY_OPTIONS,
  COURSE_ICONS,
  COURSE_ICON_CATEGORIES,
  type CourseCategoryValue,
  getCourseCategoryLabels,
} from "@/lib/course-display";

export type CourseFormValues = {
  title: string;
  description: string;
  category: CourseCategoryValue | "";
  icon: string;
  totalLessons: number;
};

export const emptyCourseForm: CourseFormValues = {
  title: "",
  description: "",
  category: "",
  icon: COURSE_ICONS[0],
  totalLessons: 10,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (form: CourseFormValues) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

export function CourseFormDialog({ open, onOpenChange, pending, onSubmit }: Props) {
  const t = useTranslations("courses");
  const [form, setForm] = useState<CourseFormValues>(emptyCourseForm);
  const [iconCategory, setIconCategory] = useState<string>("all");

  const categoryLabels = useMemo(() => getCourseCategoryLabels(t), [t]);

  useEffect(() => {
    if (open) {
      setForm(emptyCourseForm);
      setIconCategory("all");
    }
  }, [open]);

  const visibleIcons = useMemo(() => {
    if (iconCategory === "all") return [...COURSE_ICONS];
    return (
      COURSE_ICON_CATEGORIES.find((category) => category.id === iconCategory)?.emojis ?? [...COURSE_ICONS]
    );
  }, [iconCategory]);

  const selectedCategoryLabel = form.category ? categoryLabels[form.category] : t("previewUncategorized");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">{t("addCourse")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${COURSE_ACCENT}66`,
              background: `linear-gradient(135deg, ${COURSE_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border text-2xl"
              style={{ borderColor: `${COURSE_ACCENT}88`, background: "#0f0f1a" }}
            >
              {form.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base text-rpg-text" dir="auto">
                {form.title.trim() || t("previewPlaceholder")}
              </p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                {selectedCategoryLabel} · {t("previewLessons", { count: form.totalLessons })}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionBasics")}>
            <div>
              <Label htmlFor="course-title">{t("fieldTitle")}</Label>
              <Input
                id="course-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("titlePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="course-description">{t("fieldDescription")}</Label>
              <Textarea
                id="course-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionDetails")}>
            <div>
              <Label htmlFor="course-lessons">{t("fieldLessons")}</Label>
              <Input
                id="course-lessons"
                type="number"
                min={1}
                value={form.totalLessons}
                onChange={(e) => setForm({ ...form, totalLessons: Number(e.target.value) })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
              />
            </div>
            <div>
              <Label>{t("fieldCategory")}</Label>
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="flex flex-wrap gap-2">
                  {COURSE_CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                        form.category === cat.value
                          ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                          : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-purple/40",
                      )}
                    >
                      {categoryLabels[cat.value]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title={t("sectionAppearance")}>
            <div>
              <Label>{t("fieldIcon")}</Label>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setIconCategory("all")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-[11px] transition",
                    iconCategory === "all"
                      ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                      : "border-[#1e1e3a] text-rpg-secondary",
                  )}
                >
                  {t("iconAll")}
                </button>
                {COURSE_ICON_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setIconCategory(category.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[11px] transition",
                      iconCategory === category.id
                        ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] text-rpg-secondary",
                    )}
                  >
                    {category.id === "education"
                      ? t("iconCategories.education")
                      : category.id === "tech"
                        ? t("iconCategories.tech")
                        : category.id === "science"
                          ? t("iconCategories.science")
                          : category.id === "creative"
                            ? t("iconCategories.creative")
                            : category.id === "life"
                              ? t("iconCategories.life")
                              : t("iconCategories.world")}
                  </button>
                ))}
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="grid grid-cols-7 gap-1 sm:grid-cols-9">
                  {visibleIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      aria-label={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-lg transition hover:bg-[#1e1e3a]",
                        form.icon === icon && "bg-rpg-purple/25 ring-1 ring-rpg-gold/70",
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="course-icon-custom" className="text-xs text-rpg-secondary">
                  {t("iconCustom")}
                </Label>
                <Input
                  id="course-icon-custom"
                  value={form.icon}
                  maxLength={4}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
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
            disabled={pending || !form.title.trim() || !form.category}
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

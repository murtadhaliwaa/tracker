"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COLOR_SWATCHES,
  HABIT_EMOJI_CATEGORIES,
  WEEKDAYS,
  habitIconDisplay,
  type HabitFrequency,
} from "@/lib/habit-display";
import { cn } from "@/lib/utils";
import { createHabit, updateHabit } from "@/app/[locale]/(protected)/habits/actions";

export type HabitFormValues = {
  id?: string;
  title: string;
  description: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  frequencyKind: "daily" | "specific_days" | "times_per_week" | "once_per_month" | "once_per_year";
  specificDays: string[];
  timesPerWeek: number;
  logType: "CHECKBOX" | "FORM" | "TIMER";
  categoryName: string;
  xpValue: number;
  icon: string;
  color: string;
};

const emptyForm: HabitFormValues = {
  title: "",
  description: "",
  period: "DAILY",
  frequencyKind: "daily",
  specificDays: [],
  timesPerWeek: 3,
  logType: "CHECKBOX",
  categoryName: "",
  xpValue: 10,
  icon: "⚔️",
  color: "#7c5cbf",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  initial?: HabitFormValues | null;
  onSaved: () => void;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-[#1e1e3a] bg-[#13131f] px-3 py-2 text-sm text-rpg-text outline-none transition focus:border-rpg-purple/60";

const PERIODS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const PERIOD_LABEL_KEYS = {
  DAILY: "periodDaily",
  WEEKLY: "periodWeekly",
  MONTHLY: "periodMonthly",
  YEARLY: "periodYearly",
} as const;

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

function buildFrequency(values: HabitFormValues): HabitFrequency {
  switch (values.frequencyKind) {
    case "specific_days":
      return { type: "specific_days", days: values.specificDays };
    case "times_per_week":
      return { type: "times_per_week", count: values.timesPerWeek };
    case "once_per_month":
      return { type: "once_per_month" };
    case "once_per_year":
      return { type: "once_per_year" };
    default:
      return { type: "daily" };
  }
}

export function HabitFormDialog({ open, onOpenChange, categories, initial, onSaved }: Props) {
  const t = useTranslations("habits");
  const [form, setForm] = useState<HabitFormValues>(initial ?? emptyForm);
  const [emojiCategory, setEmojiCategory] = useState<string>("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initial ?? emptyForm);
    setEmojiCategory("all");
  }, [initial, open]);

  const visibleEmojis = useMemo(() => {
    if (emojiCategory === "all") {
      return HABIT_EMOJI_CATEGORIES.flatMap((category) => category.emojis);
    }
    return HABIT_EMOJI_CATEGORIES.find((category) => category.id === emojiCategory)?.emojis ?? [];
  }, [emojiCategory]);

  const submit = () => {
    startTransition(async () => {
      try {
        const payload = {
          id: form.id,
          title: form.title,
          description: form.description || undefined,
          period: form.period,
          frequency: buildFrequency(form),
          logType: form.logType,
          categoryName: form.categoryName,
          xpValue: form.xpValue,
          icon: form.icon,
          color: form.color,
        };

        if (form.id) {
          await updateHabit(payload);
          toast.success(t("updated"));
        } else {
          await createHabit(payload);
          toast.success(t("created"));
        }
        onOpenChange(false);
        onSaved();
      } catch {
        toast.error(t("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">
            {form.id ? t("editHabit") : t("addHabit")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${form.color}66`,
              background: `linear-gradient(135deg, ${form.color}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border text-2xl"
              style={{ borderColor: `${form.color}88`, background: "#0f0f1a" }}
            >
              {habitIconDisplay(form.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base text-rpg-text" dir="auto">
                {form.title.trim() || t("previewPlaceholder")}
              </p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                +{form.xpValue} XP · {t(PERIOD_LABEL_KEYS[form.period])}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionBasics")}>
            <div>
              <Label htmlFor="title">{t("fieldTitle")}</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("previewPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("fieldDescription")}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="category">{t("fieldCategory")}</Label>
              <Input
                id="category"
                list="habit-categories"
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("categoryPlaceholder")}
              />
              <datalist id="habit-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </FormSection>

          <FormSection title={t("sectionSchedule")}>
            <div>
              <Label>{t("fieldPeriod")}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setForm({ ...form, period })}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition",
                      form.period === period
                        ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-purple/40",
                    )}
                  >
                    {t(PERIOD_LABEL_KEYS[period])}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="frequency">{t("fieldFrequency")}</Label>
              <select
                id="frequency"
                className={fieldClass}
                value={form.frequencyKind}
                onChange={(e) =>
                  setForm({ ...form, frequencyKind: e.target.value as HabitFormValues["frequencyKind"] })
                }
              >
                <option value="daily">{t("freqDaily")}</option>
                <option value="specific_days">{t("freqSpecificDays")}</option>
                <option value="times_per_week">{t("freqTimesPerWeek")}</option>
                <option value="once_per_month">{t("freqOnceMonth")}</option>
                <option value="once_per_year">{t("freqOnceYear")}</option>
              </select>
            </div>
            {form.frequencyKind === "specific_days" ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition",
                      form.specificDays.includes(day)
                        ? "border-rpg-purple/50 bg-rpg-purple/15 text-rpg-text"
                        : "border-transparent text-rpg-secondary",
                    )}
                  >
                    <Checkbox
                      checked={form.specificDays.includes(day)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          specificDays: checked
                            ? [...form.specificDays, day]
                            : form.specificDays.filter((d) => d !== day),
                        });
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            ) : null}
            {form.frequencyKind === "times_per_week" ? (
              <div>
                <Label htmlFor="timesPerWeek">{t("fieldTimesPerWeek")}</Label>
                <Input
                  id="timesPerWeek"
                  type="number"
                  min={1}
                  max={7}
                  value={form.timesPerWeek}
                  onChange={(e) => setForm({ ...form, timesPerWeek: Number(e.target.value) })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
            ) : null}
          </FormSection>

          <FormSection title={t("sectionTracking")}>
            <div>
              <Label>{t("fieldLogType")}</Label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["CHECKBOX", "FORM", "TIMER"] as const).map((logType) => (
                  <button
                    key={logType}
                    type="button"
                    onClick={() => setForm({ ...form, logType })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs transition",
                      form.logType === logType
                        ? "border-rpg-purple/50 bg-rpg-purple/10 text-rpg-text"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-purple/30",
                    )}
                  >
                    <span className="block font-medium">
                      {logType === "CHECKBOX"
                        ? t("logCheckbox")
                        : logType === "FORM"
                          ? t("logForm")
                          : t("logTimer")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="xp">{t("fieldXp")}</Label>
              <Input
                id="xp"
                type="number"
                min={1}
                value={form.xpValue}
                onChange={(e) => setForm({ ...form, xpValue: Number(e.target.value) })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionAppearance")}>
            <div>
              <Label>{t("fieldIcon")}</Label>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setEmojiCategory("all")}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-[11px] transition",
                    emojiCategory === "all"
                      ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                      : "border-[#1e1e3a] text-rpg-secondary",
                  )}
                >
                  {t("emojiAll")}
                </button>
                {HABIT_EMOJI_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setEmojiCategory(category.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[11px] transition",
                      emojiCategory === category.id
                        ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] text-rpg-secondary",
                    )}
                  >
                    {t(`emojiCategories.${category.id}`)}
                  </button>
                ))}
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="grid grid-cols-7 gap-1 sm:grid-cols-9">
                  {visibleEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      onClick={() => setForm({ ...form, icon: emoji })}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-lg transition hover:bg-[#1e1e3a]",
                        form.icon === emoji && "bg-rpg-purple/25 ring-1 ring-rpg-gold/70",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="icon-custom" className="text-xs text-rpg-secondary">
                  {t("emojiCustom")}
                </Label>
                <Input
                  id="icon-custom"
                  value={form.icon}
                  maxLength={4}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
            </div>
            <div>
              <Label>{t("fieldColor")}</Label>
              <div className="mt-2 grid grid-cols-9 gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    className={cn(
                      "size-8 rounded-full border-2 transition hover:scale-105",
                      form.color === swatch.value ? "border-rpg-gold scale-105" : "border-transparent",
                    )}
                    style={{ background: swatch.value }}
                    onClick={() => setForm({ ...form, color: swatch.value })}
                    aria-label={swatch.name}
                  />
                ))}
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
            onClick={submit}
            disabled={pending || !form.title.trim() || !form.categoryName.trim()}
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

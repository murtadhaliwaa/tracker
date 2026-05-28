"use client";

import { useEffect, useState, useTransition } from "react";
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
import { COLOR_SWATCHES, WEEKDAYS, type HabitFrequency } from "@/lib/habit-display";
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
  icon: "⚔",
  color: "#7c5cbf",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  initial?: HabitFormValues | null;
  onSaved: () => void;
};

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
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initial ?? emptyForm);
  }, [initial, open]);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? t("editHabit") : t("addHabit")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="title">{t("fieldTitle")}</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">{t("fieldDescription")}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="period">{t("fieldPeriod")}</Label>
            <select
              id="period"
              className="mt-1 w-full rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-2 text-sm"
              value={form.period}
              onChange={(e) =>
                setForm({ ...form, period: e.target.value as HabitFormValues["period"] })
              }
            >
              <option value="DAILY">{t("periodDaily")}</option>
              <option value="WEEKLY">{t("periodWeekly")}</option>
              <option value="MONTHLY">{t("periodMonthly")}</option>
              <option value="YEARLY">{t("periodYearly")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="frequency">{t("fieldFrequency")}</Label>
            <select
              id="frequency"
              className="mt-1 w-full rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-2 text-sm"
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
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <label key={day} className="flex items-center gap-1 text-xs text-rpg-secondary">
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
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="logType">{t("fieldLogType")}</Label>
            <select
              id="logType"
              className="mt-1 w-full rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-2 text-sm"
              value={form.logType}
              onChange={(e) =>
                setForm({ ...form, logType: e.target.value as HabitFormValues["logType"] })
              }
            >
              <option value="CHECKBOX">{t("logCheckbox")}</option>
              <option value="FORM">{t("logForm")}</option>
              <option value="TIMER">{t("logTimer")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="category">{t("fieldCategory")}</Label>
            <Input
              id="category"
              list="habit-categories"
              value={form.categoryName}
              onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
            />
            <datalist id="habit-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="xp">{t("fieldXp")}</Label>
            <Input
              id="xp"
              type="number"
              min={1}
              value={form.xpValue}
              onChange={(e) => setForm({ ...form, xpValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="icon">{t("fieldIcon")}</Label>
            <Input id="icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <div>
            <Label>{t("fieldColor")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  className={`size-8 rounded-full border-2 ${form.color === swatch.value ? "border-white" : "border-transparent"}`}
                  style={{ background: swatch.value }}
                  onClick={() => setForm({ ...form, color: swatch.value })}
                  aria-label={swatch.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || !form.title || !form.categoryName}>
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

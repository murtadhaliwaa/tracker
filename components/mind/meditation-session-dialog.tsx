"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Brain } from "lucide-react";
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

const MEDITATION_ACCENT = "#2dd4bf";
const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60] as const;

export type MeditationFormValues = {
  duration: number;
  notes: string;
  date: string;
};

export const emptyMeditationForm = (): MeditationFormValues => ({
  duration: 10,
  notes: "",
  date: new Date().toISOString().slice(0, 10),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (form: MeditationFormValues) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

export function MeditationSessionDialog({ open, onOpenChange, pending, onSubmit }: Props) {
  const t = useTranslations("mind");
  const [form, setForm] = useState<MeditationFormValues>(emptyMeditationForm);

  useEffect(() => {
    if (open) setForm(emptyMeditationForm());
  }, [open]);

  const formattedDate = form.date
    ? new Date(`${form.date}T12:00:00`).toLocaleDateString()
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">{t("logSession")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${MEDITATION_ACCENT}66`,
              background: `linear-gradient(135deg, ${MEDITATION_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: `${MEDITATION_ACCENT}88`, background: "#0f0f1a" }}
            >
              <Brain className="size-6 text-rpg-teal" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base text-rpg-text">{t("calmFocus")}</p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                {t("previewMeditation", { minutes: form.duration, date: formattedDate })}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionSession")}>
            <div>
              <Label>{t("duration")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setForm({ ...form, duration: minutes })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                      form.duration === minutes
                        ? "border-rpg-teal/50 bg-rpg-teal/10 text-rpg-teal"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-teal/30",
                    )}
                  >
                    {minutes} {t("minutesShort")}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="med-duration-custom" className="text-xs text-rpg-secondary">
                  {t("durationCustom")}
                </Label>
                <Input
                  id="med-duration-custom"
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
            </div>
            <p className="text-xs text-rpg-secondary">{t("deepFocus")}</p>
          </FormSection>

          <FormSection title={t("sectionNotes")}>
            <div>
              <Label htmlFor="med-notes">{t("notes")}</Label>
              <Textarea
                id="med-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("notesPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="med-date">{t("date")}</Label>
              <Input
                id="med-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
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
            disabled={pending || form.duration < 1}
          >
            {pending ? t("saving") : t("completeSession")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

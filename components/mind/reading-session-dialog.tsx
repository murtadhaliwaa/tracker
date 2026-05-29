"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
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

const READING_ACCENT = "#3b82f6";
const PAGE_PRESETS = [5, 10, 15, 20, 30, 50] as const;

export type ReadingFormValues = {
  bookTitle: string;
  pagesRead: number;
  notes: string;
  date: string;
};

export const emptyReadingForm = (): ReadingFormValues => ({
  bookTitle: "",
  pagesRead: 10,
  notes: "",
  date: new Date().toISOString().slice(0, 10),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  bookTitles: string[];
  onSubmit: (form: ReadingFormValues) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

export function ReadingSessionDialog({
  open,
  onOpenChange,
  pending,
  bookTitles,
  onSubmit,
}: Props) {
  const t = useTranslations("mind");
  const [form, setForm] = useState<ReadingFormValues>(emptyReadingForm);

  useEffect(() => {
    if (open) setForm(emptyReadingForm());
  }, [open]);

  const formattedDate = form.date
    ? new Date(`${form.date}T12:00:00`).toLocaleDateString()
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">{t("logReading")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${READING_ACCENT}66`,
              background: `linear-gradient(135deg, ${READING_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: `${READING_ACCENT}88`, background: "#0f0f1a" }}
            >
              <BookOpen className="size-6 text-rpg-blue" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base text-rpg-text" dir="auto">
                {form.bookTitle.trim() || t("previewBookPlaceholder")}
              </p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                {t("previewReading", { pages: form.pagesRead, date: formattedDate })}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionBook")}>
            <div>
              <Label htmlFor="read-book">{t("bookTitle")}</Label>
              <Input
                id="read-book"
                list="mind-books"
                value={form.bookTitle}
                onChange={(e) => setForm({ ...form, bookTitle: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("bookTitlePlaceholder")}
              />
              <datalist id="mind-books">
                {bookTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>
            {bookTitles.length > 0 ? (
              <div>
                <Label className="text-xs text-rpg-secondary">{t("recentBooks")}</Label>
                <div className="mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {bookTitles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setForm({ ...form, bookTitle: title })}
                      className={cn(
                        "max-w-full truncate rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                        form.bookTitle === title
                          ? "border-rpg-blue/50 bg-rpg-blue/10 text-rpg-blue"
                          : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-blue/30",
                      )}
                      dir="auto"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </FormSection>

          <FormSection title={t("sectionSession")}>
            <div>
              <Label>{t("pagesRead")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PAGE_PRESETS.map((pages) => (
                  <button
                    key={pages}
                    type="button"
                    onClick={() => setForm({ ...form, pagesRead: pages })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                      form.pagesRead === pages
                        ? "border-rpg-blue/50 bg-rpg-blue/10 text-rpg-blue"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-blue/30",
                    )}
                  >
                    {pages} {t("pagesShort")}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="read-pages-custom" className="text-xs text-rpg-secondary">
                  {t("pagesCustom")}
                </Label>
                <Input
                  id="read-pages-custom"
                  type="number"
                  min={1}
                  value={form.pagesRead}
                  onChange={(e) => setForm({ ...form, pagesRead: Number(e.target.value) })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="read-date">{t("date")}</Label>
              <Input
                id="read-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionNotes")}>
            <div>
              <Label htmlFor="read-notes">{t("notes")}</Label>
              <Textarea
                id="read-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("readingNotesPlaceholder")}
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
            disabled={pending || !form.bookTitle.trim() || form.pagesRead < 1}
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

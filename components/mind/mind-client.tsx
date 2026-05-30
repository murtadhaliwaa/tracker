"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { patchShellFromAward } from "@/lib/shell-stats-client";
import { toast } from "sonner";
import { BookOpen, Brain, Trash2 } from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-fetch";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { deleteMeditationSession } from "@/app/[locale]/(protected)/mind/actions";
import {
  MeditationSessionDialog,
  type MeditationFormValues,
} from "@/components/mind/meditation-session-dialog";
import {
  ReadingSessionDialog,
  type ReadingFormValues,
} from "@/components/mind/reading-session-dialog";

type MeditationItem = {
  id: string;
  type: string;
  duration: number;
  notes: string | null;
  createdAt: string;
  sessionDate?: string;
  xp: number;
};

type ReadingItem = {
  id: string;
  bookTitle: string;
  pagesRead: number;
  rating: number | null;
  notes: string | null;
  createdAt: string;
};

type Props = {
  meditationCount: number;
  totalMinutes: number;
  avgDuration: number;
  readingCount: number;
  totalPages: number;
  avgPages: number;
  recentMeditations: MeditationItem[];
  readingSessions: ReadingItem[];
  bookTitles: string[];
};

export function MindClient(props: Props) {
  const t = useTranslations("mind");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [medOpen, setMedOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const [meditationCount, setMeditationCount] = useState(props.meditationCount);
  const [totalMinutes, setTotalMinutes] = useState(props.totalMinutes);
  const [readingCount, setReadingCount] = useState(props.readingCount);
  const [totalPages, setTotalPages] = useState(props.totalPages);
  const [recentMeditations, setRecentMeditations] = useState(props.recentMeditations);
  const [readingSessions, setReadingSessions] = useState(props.readingSessions);

  useEffect(() => {
    setMeditationCount(props.meditationCount);
    setTotalMinutes(props.totalMinutes);
    setReadingCount(props.readingCount);
    setTotalPages(props.totalPages);
    setRecentMeditations(props.recentMeditations);
    setReadingSessions(props.readingSessions);
  }, [
    props.meditationCount,
    props.totalMinutes,
    props.readingCount,
    props.totalPages,
    props.recentMeditations,
    props.readingSessions,
  ]);

  const booksGrouped = useMemo(() => {
    const map = new Map<
      string,
      { totalPages: number; lastDate: string; sessions: ReadingItem[] }
    >();
    for (const s of readingSessions) {
      const existing = map.get(s.bookTitle) ?? { totalPages: 0, lastDate: s.createdAt, sessions: [] };
      existing.totalPages += s.pagesRead;
      existing.lastDate = s.createdAt > existing.lastDate ? s.createdAt : existing.lastDate;
      existing.sessions.push(s);
      map.set(s.bookTitle, existing);
    }
    return [...map.entries()];
  }, [readingSessions]);

  const avgDuration = meditationCount ? Math.round(totalMinutes / meditationCount) : 0;
  const avgPages = readingCount ? Math.round(totalPages / readingCount) : 0;

  const submitMeditation = (medForm: MeditationFormValues) => {
    if (medForm.duration < 1) return;
    startTransition(async () => {
      try {
        const result = await apiFetch<{
          session: {
            id: string;
            type: string;
            duration: number;
            notes: string | null;
            sessionDate: string;
            createdAt: string;
          };
          xpAwarded: number;
          leveledUp: boolean;
          newLevel: number;
          newTitle: string;
        }>("/api/mind/meditation", {
          method: "POST",
          body: JSON.stringify({
            duration: medForm.duration,
            notes: medForm.notes || undefined,
            date: medForm.date,
          }),
        });

        setMeditationCount((c) => c + 1);
        setTotalMinutes((m) => m + medForm.duration);
        setRecentMeditations((prev) =>
          [
            {
              id: result.session.id,
              type: result.session.type,
              duration: result.session.duration,
              notes: result.session.notes,
              createdAt: result.session.createdAt,
              sessionDate: result.session.sessionDate,
              xp: result.xpAwarded,
            },
            ...prev,
          ].slice(0, 5),
        );

        toast.success(t("sessionLogged"));
        patchShellFromAward(result);
        if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        setMedOpen(false);
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const submitReading = (readForm: ReadingFormValues) => {
    if (!readForm.bookTitle.trim() || readForm.pagesRead < 1) return;
    startTransition(async () => {
      try {
        const result = await apiFetch<{
          session: {
            id: string;
            bookTitle: string;
            pagesRead: number;
            rating: number | null;
            notes: string | null;
            createdAt: string;
          };
          xpAwarded: number;
          leveledUp: boolean;
          newLevel: number;
          newTitle: string;
        }>("/api/mind/reading", {
          method: "POST",
          body: JSON.stringify({
            bookTitle: readForm.bookTitle,
            pagesRead: readForm.pagesRead,
            notes: readForm.notes || undefined,
            date: readForm.date,
          }),
        });

        setReadingCount((c) => c + 1);
        setTotalPages((p) => p + readForm.pagesRead);
        setReadingSessions((prev) => [
          {
            id: result.session.id,
            bookTitle: result.session.bookTitle,
            pagesRead: result.session.pagesRead,
            rating: result.session.rating,
            notes: result.session.notes,
            createdAt: result.session.createdAt,
          },
          ...prev,
        ]);

        toast.success(t("readingLogged"));
        patchShellFromAward(result);
        if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        setReadOpen(false);
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

      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RPGCard glow="teal" className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rpg-teal/10 p-3">
              <Brain className="size-7 text-rpg-teal" />
            </div>
            <div>
              <p className="text-sm text-rpg-secondary">{t("meditation")}</p>
              <h2 className="font-heading text-xl text-rpg-text">{t("calmFocus")}</h2>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-[#D4AF37]">{meditationCount}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("sessions")}</p>
            </div>
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-rpg-text">{totalMinutes}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("minutes")}</p>
            </div>
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-rpg-teal">{avgDuration}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("avgSession")}</p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4 border-rpg-teal text-rpg-teal hover:bg-rpg-teal/10"
            variant="outline"
            onClick={() => setMedOpen(true)}
          >
            {t("logSession")}
          </Button>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-rpg-secondary">{t("recentSessions")}</p>
            {recentMeditations.length === 0 ? (
              <p className="text-xs text-rpg-secondary">{t("empty")}</p>
            ) : null}
            {recentMeditations.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-rpg-text">{s.type}</p>
                  <p className="text-xs text-rpg-secondary">
                    {s.duration} {t("minutes")} ·{" "}
                    {new Date(s.sessionDate ?? s.createdAt).toLocaleDateString()} · +{s.xp} XP
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteMeditationSession(s.id);
                      setRecentMeditations((prev) => prev.filter((m) => m.id !== s.id));
                      setMeditationCount((c) => Math.max(0, c - 1));
                      setTotalMinutes((m) => Math.max(0, m - s.duration));
                      toast.success(t("deleted"));
                    })
                  }
                >
                  <Trash2 className="size-4 text-rpg-red" />
                </Button>
              </div>
            ))}
          </div>
        </RPGCard>

        <RPGCard glow="blue" className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rpg-blue/10 p-3">
              <BookOpen className="size-7 text-rpg-blue" />
            </div>
            <div>
              <p className="text-sm text-rpg-secondary">{t("reading")}</p>
              <h2 className="font-heading text-xl text-rpg-text">{t("knowledgeQuest")}</h2>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-[#D4AF37]">{readingCount}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("sessions")}</p>
            </div>
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-rpg-text">{totalPages}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("pages")}</p>
            </div>
            <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <p className="text-2xl font-heading text-rpg-blue">{avgPages}</p>
              <p className="mt-1 text-xs text-rpg-secondary">{t("avgSession")}</p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4 border-rpg-blue text-rpg-blue hover:bg-rpg-blue/10"
            variant="outline"
            onClick={() => setReadOpen(true)}
          >
            {t("logReading")}
          </Button>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold text-rpg-secondary">{t("readingLog")}</p>
            {booksGrouped.length === 0 ? (
              <p className="text-xs text-rpg-secondary">{t("empty")}</p>
            ) : null}
            {booksGrouped.map(([title, data]) => (
              <div key={title} className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedBook(expandedBook === title ? null : title)}
                >
                  <p className="font-medium text-rpg-text">{title}</p>
                  <p className="text-xs text-rpg-secondary">
                    {data.totalPages} {t("pages")} · {new Date(data.lastDate).toLocaleDateString()}
                  </p>
                </button>
                {expandedBook === title ? (
                  <div className="mt-2 space-y-1 border-t border-[#1e1e3a] pt-2">
                    {data.sessions.map((s) => (
                      <p key={s.id} className="text-xs text-rpg-secondary">
                        {new Date(s.createdAt).toLocaleDateString()} — {s.pagesRead} {t("pages")}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </RPGCard>
      </div>

      <MeditationSessionDialog
        open={medOpen}
        onOpenChange={setMedOpen}
        pending={pending}
        onSubmit={submitMeditation}
      />

      <ReadingSessionDialog
        open={readOpen}
        onOpenChange={setReadOpen}
        pending={pending}
        bookTitles={props.bookTitles}
        onSubmit={submitReading}
      />
    </div>
  );
}

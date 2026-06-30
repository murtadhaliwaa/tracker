"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { patchShellFromAward } from "@/lib/shell-stats-client";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Check,
  Flame,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LazyLevelUpModal } from "@/components/shared/lazy-level-up-modal";
import { PerfectDayBanner } from "@/components/shared/perfect-day-banner";
import type { HabitFormValues } from "@/components/habits/habit-form-dialog";
import { habitIconDisplay, habitAccentColor, type HabitFrequency } from "@/lib/habit-display";
import type { HabitClientItem } from "@/lib/page-data/habits";
import {
  archiveHabit,
  deleteHabit,
  logHabit,
  unarchiveHabit,
  updateHabitOrder,
} from "@/app/[locale]/(protected)/habits/actions";

const HabitFormDialog = dynamic(
  () => import("@/components/habits/habit-form-dialog").then((m) => m.HabitFormDialog),
  { ssr: false },
);

export type { HabitClientItem } from "@/lib/page-data/habits";

type Props = {
  habits: HabitClientItem[];
  categories: string[];
};

function parseFrequency(frequency: HabitFrequency | null): Pick<HabitFormValues, "frequencyKind" | "specificDays" | "timesPerWeek"> {
  if (!frequency) return { frequencyKind: "daily", specificDays: [], timesPerWeek: 3 };
  if (frequency.type === "specific_days") {
    return { frequencyKind: "specific_days", specificDays: frequency.days, timesPerWeek: 3 };
  }
  if (frequency.type === "times_per_week") {
    return { frequencyKind: "times_per_week", specificDays: [], timesPerWeek: frequency.count };
  }
  if (frequency.type === "once_per_month") return { frequencyKind: "once_per_month", specificDays: [], timesPerWeek: 3 };
  if (frequency.type === "once_per_year") return { frequencyKind: "once_per_year", specificDays: [], timesPerWeek: 3 };
  return { frequencyKind: "daily", specificDays: [], timesPerWeek: 3 };
}

function HabitTimer({ onComplete }: { habitId: string; logType: "TIMER"; onComplete: (duration: number, deepFocus: boolean) => void }) {
  const t = useTranslations("habits");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [deepFocus, setDeepFocus] = useState(false);

  useMemo(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[#1e1e3a] bg-[#13131f] p-3">
      <p className="text-center font-mono text-2xl text-rpg-gold">
        {mm}:{ss}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setRunning(true)} disabled={running}>
          {t("timerStart")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRunning(false)} disabled={!running}>
          {t("timerPause")}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setRunning(false);
            onComplete(Math.max(1, Math.ceil(seconds / 60)), deepFocus);
            setSeconds(0);
          }}
          disabled={seconds === 0}
        >
          {t("timerStop")}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-rpg-secondary">
        <Checkbox checked={deepFocus} onCheckedChange={(v) => setDeepFocus(Boolean(v))} />
        {t("deepFocus")}
      </label>
    </div>
  );
}

function SortableHabitRow({
  habit,
  accentContext,
  archived,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onComplete,
}: {
  habit: HabitClientItem;
  accentContext: { id: string; color: string }[];
  archived: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onComplete: (notes?: string, duration?: number, deepFocus?: boolean) => void;
}) {
  const t = useTranslations("habits");
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: habit.id, disabled: archived });
  const [formOpen, setFormOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [timerOpen, setTimerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition };

  const completeControl = habit.completedToday ? (
    <div className="inline-flex items-center gap-1 rounded-lg border border-rpg-green/40 bg-rpg-green/10 px-2 py-1 text-xs font-bold text-rpg-green">
      <Check className="size-4" />
      <span className="hidden sm:inline">{t("completed")}</span>
    </div>
  ) : habit.logType === "CHECKBOX" ? (
    <Button size="sm" variant="outline" className="shrink-0" onClick={() => onComplete()}>
      {t("complete")}
    </Button>
  ) : habit.logType === "FORM" ? (
    <Button size="sm" variant="outline" className="shrink-0" onClick={() => setFormOpen(true)}>
      {t("complete")}
    </Button>
  ) : (
    <Button size="sm" variant="outline" className="shrink-0" onClick={() => setTimerOpen((v) => !v)}>
      {timerOpen ? t("hideTimer") : t("startTimer")}
    </Button>
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          borderLeftWidth: 4,
          borderLeftStyle: "solid",
          borderLeftColor: habitAccentColor(accentContext, habit.id),
        }}
        className="flex items-start gap-2 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] px-3 py-2.5 sm:items-center sm:justify-between sm:gap-3"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {!archived ? (
            <button type="button" className="mt-0.5 shrink-0 text-rpg-secondary" {...attributes} {...listeners}>
              <GripVertical className="size-4" />
            </button>
          ) : null}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] text-lg">
            {habitIconDisplay(habit.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              dir="auto"
              className={`text-sm leading-snug break-words ${
                habit.completedToday ? "text-rpg-green line-through" : "text-rpg-text"
              }`}
            >
              {habit.title}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-rpg-secondary">
              <span>+{habit.xpValue} XP</span>
              <span className="inline-flex items-center gap-1 sm:hidden">
                <Flame className="size-3 text-rpg-gold" />
                {habit.currentStreak}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <p className="me-1 hidden items-center gap-1 text-xs text-rpg-secondary sm:flex">
            <Flame className="size-3 text-rpg-gold" /> {habit.currentStreak}
          </p>
          {!archived ? (
            <>
              <div className="hidden items-center gap-1 sm:flex">
                <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={t("editHabit")}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={onArchive} aria-label={t("archiveHabit")}>
                  <Archive className="size-4" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label={t("delete")}>
                  <Trash2 className="size-4 text-rpg-red" />
                </Button>
              </div>
              {completeControl}
              <div className="relative sm:hidden">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("moreActions")}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <MoreVertical className="size-4" />
                </Button>
                {menuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      aria-label={t("cancel")}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute end-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border border-[#1e1e3a] bg-[#13131f] py-1 shadow-xl">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rpg-text hover:bg-[#1e1e3a]"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                      >
                        <Pencil className="size-4" />
                        {t("editHabit")}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rpg-text hover:bg-[#1e1e3a]"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive();
                        }}
                      >
                        <Archive className="size-4" />
                        {t("archiveHabit")}
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rpg-red hover:bg-[#1e1e3a]"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                      >
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={onUnarchive}>
              <ArchiveRestore className="size-4" />
              <span className="hidden sm:inline">{t("unarchive")}</span>
            </Button>
          )}
        </div>
      </div>
      {timerOpen && habit.logType === "TIMER" ? (
        <HabitTimer
          habitId={habit.id}
          logType="TIMER"
          onComplete={(duration, deepFocus) => onComplete(undefined, duration, deepFocus)}
        />
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("formNotesTitle")}</DialogTitle>
          </DialogHeader>
          <Label htmlFor="notes">{t("formNotesLabel")}</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button
              onClick={() => {
                onComplete(notes);
                setFormOpen(false);
                setNotes("");
              }}
            >
              {t("complete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HabitsClient({ habits: initialHabits, categories }: Props) {
  const t = useTranslations("habits");
  const [habits, setHabits] = useState(initialHabits);
  const [formOpen, setFormOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<HabitFormValues | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [perfectDay, setPerfectDay] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    return {
      DAILY: habits.filter((h) => h.period === "DAILY" && !h.isArchived),
      WEEKLY: habits.filter((h) => h.period === "WEEKLY" && !h.isArchived),
      MONTHLY: habits.filter((h) => h.period === "MONTHLY" && !h.isArchived),
      YEARLY: habits.filter((h) => h.period === "YEARLY" && !h.isArchived),
      ARCHIVED: habits.filter((h) => h.isArchived),
    };
  }, [habits]);

  const handleComplete = (habit: HabitClientItem, notes?: string, duration?: number, deepFocus?: boolean) => {
    startTransition(async () => {
      try {
        const result = await logHabit({
          habitId: habit.id,
          logType: habit.logType,
          notes,
          duration,
          deepFocus,
        });
        setHabits((prev) =>
          prev.map((h) => (h.id === habit.id ? { ...h, completedToday: true, currentStreak: h.currentStreak + 1 } : h)),
        );
        toast.success(t("habitLogged", { xp: result.xpAwarded }));
        patchShellFromAward(result);
        if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        if (result.perfectDay.isPerfectDay && result.perfectDay.bonusAwarded) setPerfectDay(true);
      } catch {
        toast.error(t("error"));
      }
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeHabit = habits.find((h) => h.id === active.id);
    const overHabit = habits.find((h) => h.id === over.id);
    if (!activeHabit || !overHabit) return;

    const groupFor = (habit: HabitClientItem): keyof typeof grouped =>
      habit.isArchived ? "ARCHIVED" : habit.period;

    const period = groupFor(activeHabit);
    if (period !== groupFor(overHabit)) return;

    const items = grouped[period];
    const oldIndex = items.findIndex((h) => h.id === active.id);
    const newIndex = items.findIndex((h) => h.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setHabits((prev) => {
      const others =
        period === "ARCHIVED"
          ? prev.filter((h) => !h.isArchived)
          : prev.filter((h) => h.isArchived || h.period !== period);
      return [...others, ...reordered.map((h, idx) => ({ ...h, order: idx + 1 }))];
    });
    startTransition(async () => {
      await updateHabitOrder({
        items: reordered.map((h, idx) => ({ id: h.id, order: idx + 1 })),
      });
    });
  };

  const periodLabels: Record<keyof typeof grouped, string> = {
    DAILY: t("periodDaily"),
    WEEKLY: t("periodWeekly"),
    MONTHLY: t("periodMonthly"),
    YEARLY: t("periodYearly"),
    ARCHIVED: t("tabArchived"),
  };

  const empty = habits.length === 0;

  const periodSections = (Object.entries(grouped) as [keyof typeof grouped, HabitClientItem[]][]).map(
    ([period, items]) => {
      if (period !== "ARCHIVED" && items.length === 0) return null;
      if (period === "ARCHIVED" && items.length === 0) return null;
      const dailyPerfect = period === "DAILY" && items.length > 0 && items.every((h) => h.completedToday);

      return (
        <RPGCard key={period} glow={period === "DAILY" ? (dailyPerfect ? "gold" : "teal") : "purple"}>
          <div className="flex items-center gap-3">
            <p className="text-sm tracking-wide text-rpg-text">{periodLabels[period]}</p>
            <span className="rounded-full border border-[#1e1e3a] bg-[#0f0f1a] px-2 py-0.5 text-[11px] text-rpg-secondary">
              {items.length}
            </span>
          </div>
          <SortableContext items={items.map((h) => h.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-3 space-y-2">
              {items.map((habit) => (
                <SortableHabitRow
                  key={habit.id}
                  habit={habit}
                  accentContext={items}
                  archived={period === "ARCHIVED"}
                  onEdit={() => {
                    const freq = parseFrequency(habit.frequency);
                    setEditHabit({
                      id: habit.id,
                      title: habit.title,
                      description: habit.description ?? "",
                      period: habit.period,
                      logType: habit.logType,
                      categoryName: habit.category ?? "",
                      xpValue: habit.xpValue,
                      icon: habit.icon,
                      color: habit.color,
                      ...freq,
                    });
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleteId(habit.id)}
                  onArchive={() => {
                    startTransition(async () => {
                      await archiveHabit(habit.id);
                      setHabits((prev) =>
                        prev.map((h) => (h.id === habit.id ? { ...h, isArchived: true } : h)),
                      );
                      toast.success(t("archived"));
                    });
                  }}
                  onUnarchive={() => {
                    startTransition(async () => {
                      await unarchiveHabit(habit.id);
                      setHabits((prev) =>
                        prev.map((h) => (h.id === habit.id ? { ...h, isArchived: false } : h)),
                      );
                      toast.success(t("unarchived"));
                    });
                  }}
                  onComplete={(notes, duration, deepFocus) => handleComplete(habit, notes, duration, deepFocus)}
                />
              ))}
            </div>
          </SortableContext>
        </RPGCard>
      );
    },
  );

  return (
    <div className="space-y-5">
      <PerfectDayBanner show={perfectDay} />
      <LazyLevelUpModal
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
            variant="outline"
            className="border-[#f0c040] bg-transparent text-[#f0c040] hover:bg-[rgba(240,192,64,0.1)]"
            onClick={() => {
              setEditHabit(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("addHabit")}
          </Button>
        }
      />

      {empty ? (
        <RPGCard glow="gold" className="p-6 text-center">
          <p className="text-rpg-secondary">{t("empty")}</p>
          <Button
            className="mt-4 border-[#f0c040] bg-transparent text-[#f0c040] hover:bg-[rgba(240,192,64,0.1)]"
            variant="outline"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="size-4" />
            {t("addHabit")}
          </Button>
        </RPGCard>
      ) : null}

      <DndContext id="life-rpg-habits" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {periodSections}
      </DndContext>

      {formOpen ? (
        <HabitFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          categories={categories}
          initial={editHabit}
          onSaved={() => setFormOpen(false)}
        />
      ) : null}

      <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border-[#1e1e3a] bg-[#0f0f1a]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rpg-red text-white hover:bg-rpg-red/90"
              onClick={() => {
                if (!deleteId) return;
                startTransition(async () => {
                  await deleteHabit(deleteId);
                  setHabits((prev) => prev.filter((h) => h.id !== deleteId));
                  toast.success(t("deleted"));
                  setDeleteId(null);
                });
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

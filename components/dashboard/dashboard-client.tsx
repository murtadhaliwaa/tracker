"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { patchShellFromAward, dispatchShellStats } from "@/lib/shell-stats-client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Flame, Check, Quote, Skull, Sparkles, Loader2 } from "lucide-react";
import { RPGEmptyState } from "@/components/ui/rpg-empty-state";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { PerfectDayCelebrationBanner } from "@/components/shared/perfect-day-celebration-banner";
import BorderGlow from "@/components/BorderGlow";
import { RPG_BORDER_GLOW } from "@/components/react-bits/rpg-theme";
import { habitIconDisplay, habitAccentColor } from "@/lib/habit-display";
import { logHabit } from "@/app/[locale]/(protected)/habits/actions";
import { getMissedHabitsYesterday, useStreakFreeze as activateStreakFreeze } from "@/app/[locale]/(protected)/dashboard/actions";

const AnimatedContent = dynamic(() => import("@/components/AnimatedContent"), { ssr: false });
const DashboardMagicBento = dynamic(
  () => import("@/components/dashboard/dashboard-magic-bento").then((m) => m.DashboardMagicBento),
  { ssr: false },
);
const OnboardingModal = dynamic(
  () =>
    import("@/components/onboarding/onboarding-modal").then((mod) => mod.OnboardingModal),
  { ssr: false },
);

type DailyHabit = {
  id: string;
  title: string;
  xpValue: number;
  icon: string;
  color: string;
  logType: "CHECKBOX" | "FORM" | "TIMER";
  currentStreak: number;
  completed: boolean;
};

type Props = {
  title: string;
  streak: number;
  freezesAvailable: number;
  healthValue: number;
  maxHealth: number;
  level: number;
  profileTitle: string;
  currentXP: number;
  xpToNextLevel: number;
  dailyHabits: DailyHabit[];
  boss: {
    title: string;
    description: string | null;
    currentValue: number;
    targetValue: number;
    xpReward: number;
    isCompleted: boolean;
  };
  reflection: { highlight: string; date: string } | null;
  showOnboarding: boolean;
};

export function DashboardClient(props: Props) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [boss, setBoss] = useState(props.boss);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [missedHabits, setMissedHabits] = useState<{ id: string; title: string }[]>([]);
  const [formHabitId, setFormHabitId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [showPerfectDayCelebration, setShowPerfectDayCelebration] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [floatXp, setFloatXp] = useState<{ id: string; xp: number } | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>(
    props.dailyHabits.filter((h) => h.completed).map((h) => h.id),
  );

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const perfectDayActiveKey = `perfect-day-active-${todayKey}`;
  const perfectDayDismissKey = `perfect-day-dismissed-${todayKey}`;

  const isPerfectDay =
    props.dailyHabits.length > 0 && props.dailyHabits.every((h) => completedIds.includes(h.id));

  useEffect(() => {
    setBoss(props.boss);
  }, [props.boss]);

  useEffect(() => {
    const onBossUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) setBoss((prev) => ({ ...prev, ...detail }));
    };
    window.addEventListener("boss-updated", onBossUpdated);
    return () => window.removeEventListener("boss-updated", onBossUpdated);
  }, []);

  useEffect(() => {
    setCompletedIds(props.dailyHabits.filter((h) => h.completed).map((h) => h.id));
  }, [props.dailyHabits]);

  useEffect(() => {
    const dismissed = localStorage.getItem(perfectDayDismissKey);
    if (dismissed) return;
    const active = localStorage.getItem(perfectDayActiveKey);
    if (active === "1" || isPerfectDay) {
      setShowPerfectDayCelebration(true);
      if (isPerfectDay && active !== "1") {
        localStorage.setItem(perfectDayActiveKey, "1");
      }
    }
  }, [isPerfectDay, perfectDayActiveKey, perfectDayDismissKey]);

  const dismissPerfectDay = () => {
    setShowPerfectDayCelebration(false);
    localStorage.setItem(perfectDayDismissKey, "1");
  };

  const triggerHabitAnimation = (habitId: string, xp: number) => {
    setAnimatingId(habitId);
    setFloatXp({ id: habitId, xp });
    setTimeout(() => {
      setAnimatingId(null);
      setFloatXp(null);
    }, 600);
  };

  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? t("greetingMorning")
      : hour >= 12 && hour < 17
        ? t("greetingAfternoon")
        : hour >= 17 && hour < 21
          ? t("greetingEvening")
          : t("greetingNight");

  const bossPercent = boss.targetValue
    ? Math.min(100, Math.round((boss.currentValue / boss.targetValue) * 100))
    : 0;

  const completeHabit = (habit: DailyHabit, habitNotes?: string, recoveryQuest?: boolean) => {
    startTransition(async () => {
      try {
        const result = await logHabit({
          habitId: habit.id,
          logType: habit.logType,
          notes: habitNotes,
          recoveryQuest,
        });
        setCompletedIds((prev) => [...prev, habit.id]);
        toast.success(tc("xpAwarded", { xp: result.xpAwarded }));
        patchShellFromAward(result);
        if (result.boss) {
          setBoss((prev) => ({
            ...prev,
            currentValue: result.boss.currentValue,
            isCompleted: result.boss.isCompleted,
          }));
        }
        if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        if (result.perfectDay.isPerfectDay) {
          setShowPerfectDayCelebration(true);
          localStorage.setItem(perfectDayActiveKey, "1");
          localStorage.removeItem(perfectDayDismissKey);
        }
        if (recoveryQuest) toast.success(t("recoverySuccess"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const openRecoveryQuest = () => {
    setRecoveryOpen(true);
    setRecoveryLoading(true);
    setMissedHabits([]);
    void getMissedHabitsYesterday()
      .then(setMissedHabits)
      .finally(() => setRecoveryLoading(false));
  };

  return (
    <div className="space-y-10">
      {props.showOnboarding ? <OnboardingModal open /> : null}

      <LevelUpModal
        open={Boolean(levelUp)}
        onOpenChange={() => setLevelUp(null)}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
      />

      <RPGPageHeader title={props.title} />

      <div className="rpg-greeting flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-rpg-gold" />
        <p className="text-sm italic text-rpg-muted">{greeting}</p>
      </div>

      {showPerfectDayCelebration ? (
        <PerfectDayCelebrationBanner onDismiss={dismissPerfectDay} />
      ) : null}

      {props.healthValue === 0 ? (
        <RPGCard glow="none" className="border border-rpg-danger/40 bg-rpg-danger/10">
          <p className="text-sm font-medium text-rpg-danger">{t("healthDepleted")}</p>
        </RPGCard>
      ) : null}

      <AnimatedContent distance={24} duration={0.55} threshold={0.08}>
        <DashboardMagicBento
          streak={props.streak}
          freezesAvailable={props.freezesAvailable}
          healthValue={props.healthValue}
          maxHealth={props.maxHealth}
          level={props.level}
          profileTitle={props.profileTitle}
          currentXP={props.currentXP}
          xpToNextLevel={props.xpToNextLevel}
          dailyCompleted={completedIds.length}
          dailyTotal={props.dailyHabits.length}
          isPerfectDay={isPerfectDay}
          bossTitle={boss.title}
          bossCurrent={boss.currentValue}
          bossTarget={boss.targetValue}
          onUseFreeze={() => setFreezeOpen(true)}
          onRecoveryQuest={openRecoveryQuest}
          freezeDisabled={props.freezesAvailable <= 0 || pending}
          recoveryDisabled={pending}
          showRecoveryQuest={props.healthValue < props.maxHealth}
        />
      </AnimatedContent>

      <AnimatedContent distance={24} duration={0.55} threshold={0.08} delay={0.08}>
        <div className="grid gap-4 lg:grid-cols-2">
        <RPGCard glow="none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-rpg-muted">{t("dailyHabits")}</p>
              {isPerfectDay ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-rpg-gold/40 bg-rpg-gold/10 px-3 py-1 text-xs font-bold text-rpg-gold">
                  <Flame className="size-4" />
                  {t("perfectDay")}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-rpg-muted">{t("totalCount", { count: props.dailyHabits.length })}</p>
          </div>
          <div className="mt-3 space-y-2">
            {props.dailyHabits.length ? (
              props.dailyHabits.map((habit) => {
                const completed = completedIds.includes(habit.id);
                const animating = animatingId === habit.id;
                return (
                  <div
                    key={habit.id}
                    className={cn(
                      "rpg-habit-row relative flex items-center justify-between gap-3 rounded-lg border border-rpg-border bg-rpg-surface px-4 py-3",
                      completed && "rpg-habit-row-completed",
                      animating && "habit-card-flash",
                    )}
                    style={{
                      borderLeftWidth: 4,
                      borderLeftStyle: "solid",
                      borderLeftColor: habitAccentColor(props.dailyHabits, habit.id),
                    }}
                  >
                    {floatXp?.id === habit.id ? (
                      <span className="habit-xp-float pointer-events-none absolute end-20 top-2 z-10 text-xs font-bold text-rpg-gold">
                        +{floatXp.xp} XP
                      </span>
                    ) : null}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-rpg-border bg-rpg-surface text-lg">
                        {habitIconDisplay(habit.icon)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm",
                            animating
                              ? "habit-complete-strike"
                              : completed
                                ? "text-rpg-success line-through"
                                : "text-rpg-text",
                          )}
                        >
                          {habit.title}
                        </p>
                        <p className="text-xs text-rpg-muted">+{habit.xpValue} XP</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <p className="hidden text-xs text-rpg-muted sm:block">
                        <Flame
                          className={cn(
                            "inline-block size-3 text-rpg-gold",
                            animating && "habit-flame-bounce",
                          )}
                        />{" "}
                        {habit.currentStreak}
                      </p>
                      {completed ? (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-rpg-success/40 bg-rpg-success px-2 py-1 text-xs font-bold text-white">
                          <Check className={cn("size-4", animating && "animate-[rpg-check-pop_280ms_ease-out]")} />
                          {t("completed")}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          className={cn("relative", animating && "habit-complete-btn-flash")}
                          onClick={() => {
                            if (habit.logType === "FORM") {
                              setFormHabitId(habit.id);
                            } else {
                              triggerHabitAnimation(habit.id, habit.xpValue);
                              completeHabit(habit);
                            }
                          }}
                        >
                          {t("complete")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <RPGEmptyState icon={Flame} title={t("noDailyHabits")} />
            )}
          </div>
        </RPGCard>

        <BorderGlow {...RPG_BORDER_GLOW}>
          <RPGCard glow="none" className="rpg-boss-card">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-rpg-muted">
                <Skull className="size-5 text-rpg-purple" />
                {t("weeklyBoss")}
              </p>
              <h2 className="mt-2 line-clamp-2 break-words font-heading text-xl leading-snug text-rpg-text sm:text-2xl">{boss.title}</h2>
              <p className="mt-2 text-sm text-rpg-muted">{boss.description}</p>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-heading text-rpg-muted">{bossPercent}%</span>
                  <span className="text-rpg-muted">
                    {boss.currentValue} / {boss.targetValue}
                  </span>
                </div>
                <div className="rpg-progress-track">
                  <div className="rpg-progress-fill" style={{ width: `${bossPercent}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-rpg-muted">
                    {boss.currentValue} / {boss.targetValue}
                  </p>
                  <div className="rounded-lg border border-rpg-gold/40 bg-rpg-gold/10 px-3 py-1 text-xs font-bold text-rpg-gold">
                    +{boss.xpReward} XP
                  </div>
                </div>
                {boss.isCompleted ? (
                  <p className="mt-2 text-xs font-bold text-rpg-success">{t("bossComplete")}</p>
                ) : null}
              </div>
            </div>
          </RPGCard>
        </BorderGlow>
        </div>
      </AnimatedContent>

      {props.reflection ? (
        <RPGCard glow="none">
          <div className="flex items-start gap-3">
            <Quote className="mt-1 size-5 text-rpg-gold" />
            <div className="min-w-0">
              <p className="text-xs text-rpg-muted">{t("lastReflection")}</p>
              <p className="mt-1 text-base italic text-rpg-text">{props.reflection.highlight}</p>
              <p className="mt-2 text-xs text-rpg-muted">{props.reflection.date}</p>
            </div>
          </div>
        </RPGCard>
      ) : null}

      <AlertDialog open={freezeOpen} onOpenChange={setFreezeOpen}>
        <AlertDialogContent className="border-rpg-border bg-rpg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("freezeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("freezeDescription", { count: props.freezesAvailable })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await activateStreakFreeze();
                  toast.success(t("freezeSuccess"));
                  setFreezeOpen(false);
                  dispatchShellStats({ freezesAvailable: result.remaining });
                });
              }}
            >
              {t("useFreeze")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={recoveryOpen}
        onOpenChange={(open) => {
          setRecoveryOpen(open);
          if (!open) {
            setRecoveryLoading(false);
            setMissedHabits([]);
          }
        }}
      >
        <DialogContent className="border-rpg-border bg-rpg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recoveryTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-rpg-muted">{t("recoveryDescription")}</p>
          <div className="space-y-2">
            {recoveryLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-rpg-muted">
                <Loader2 className="size-4 animate-spin text-rpg-gold" />
              </div>
            ) : (
              <>
                {missedHabits.map((h) => (
                  <Button
                    key={h.id}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={pending}
                    onClick={() => {
                      const habit = props.dailyHabits.find((d) => d.id === h.id);
                      if (habit) completeHabit(habit, undefined, true);
                      setRecoveryOpen(false);
                    }}
                  >
                    {h.title}
                  </Button>
                ))}
                {missedHabits.length === 0 ? (
                  <p className="text-sm text-rpg-muted">{t("noMissedHabits")}</p>
                ) : null}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(formHabitId)} onOpenChange={() => setFormHabitId(null)}>
        <DialogContent className="border-rpg-border bg-rpg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("formNotesTitle")}</DialogTitle>
          </DialogHeader>
          <Label htmlFor="dash-notes">{t("formNotesLabel")}</Label>
          <Textarea id="dash-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => {
                const habit = props.dailyHabits.find((h) => h.id === formHabitId);
                if (habit) {
                  triggerHabitAnimation(habit.id, habit.xpValue);
                  completeHabit(habit, notes);
                }
                setFormHabitId(null);
                setNotes("");
              }}
            >
              {t("complete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

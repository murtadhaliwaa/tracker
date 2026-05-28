"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, Lock, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createReward,
  deleteReward,
  disableNotification,
  enableNotification,
  exportHabitLogsCsv,
  exportUserData,
  updateNotificationTime,
  updatePreferredLanguage,
  updateReward,
} from "@/app/[locale]/(protected)/settings/actions";

type NotificationItem = {
  id: string;
  habitTitle: string;
  time: string;
  isEnabled: boolean;
};

type RewardItem = {
  id: string;
  title: string;
  description: string | null;
  xpCost: number;
  emoji: string;
  claimedAt: string | null;
};

type Props = {
  locale: string;
  preferredLanguage: string;
  totalXP: number;
  notifications: NotificationItem[];
  rewards: RewardItem[];
};

type RewardForm = {
  id?: string;
  title: string;
  description: string;
  xpCost: number;
  emoji: string;
};

export function SettingsClient({ preferredLanguage, totalXP, notifications, rewards }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState<RewardForm>({
    title: "",
    description: "",
    xpCost: 100,
    emoji: "🎁",
  });
  const [timeEdit, setTimeEdit] = useState<{ id: string; time: string } | null>(null);

  const switchLanguage = () => {
    const next = preferredLanguage === "ar" ? "en" : "ar";
    startTransition(async () => {
      await updatePreferredLanguage({ language: next });
      const nextPath = pathname.replace(/^\/(en|ar)/, `/${next}`);
      router.push(nextPath);
      router.refresh();
    });
  };

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableRewards = rewards.filter((r) => !r.claimedAt);
  const redeemedRewards = rewards.filter((r) => r.claimedAt);

  const redeemReward = (rewardId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rewards/${rewardId}/redeem`, { method: "POST" });
        const data = (await res.json()) as { error?: string; insufficientXp?: boolean };
        if (!res.ok) {
          toast.error(data.insufficientXp ? t("insufficientXp") : tc("error"));
          return;
        }
        toast.success(t("rewardRedeemed"));
        router.refresh();
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  return (
    <div className="space-y-5">
      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      <RPGCard glow="purple" className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings2 className="size-5 text-rpg-purple" />
            <div>
              <p className="text-sm text-rpg-secondary">{t("language")}</p>
              <p className="text-sm font-heading text-rpg-text">{preferredLanguage}</p>
            </div>
          </div>
          <Button variant="outline" disabled={pending} onClick={switchLanguage}>
            {t("switchLanguage")}
          </Button>
        </div>
      </RPGCard>

      <RPGCard glow="teal" className="p-5">
        <h2 className="font-heading text-lg text-rpg-heading">{t("notifications")}</h2>
        <div className="mt-4 space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-4 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-rpg-text">{n.habitTitle}</p>
                <p className="text-xs text-rpg-secondary">{n.time}</p>
              </div>
              <Switch
                checked={n.isEnabled}
                disabled={pending}
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    if (checked) await enableNotification({ id: n.id, enabled: true });
                    else await disableNotification({ id: n.id, enabled: false });
                    toast.success(t("notificationUpdated"));
                    router.refresh();
                  })
                }
              />
              <button type="button" onClick={() => setTimeEdit({ id: n.id, time: n.time })}>
                <Bell className={`size-4 ${n.isEnabled ? "text-rpg-teal" : "text-rpg-secondary"}`} />
              </button>
            </div>
          ))}
        </div>
      </RPGCard>

      <RPGCard glow="gold" className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-rpg-heading">{t("rewardsVault")}</h2>
          <Button
            size="sm"
            variant="outline"
            className="border-[#f0c040] text-[#f0c040]"
            onClick={() => {
              setRewardForm({ title: "", description: "", xpCost: 100, emoji: "🎁" });
              setRewardOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("addReward")}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {availableRewards.map((r) => {
            const canAfford = totalXP >= r.xpCost;
            return (
              <div
                key={r.id}
                className={`relative overflow-hidden rounded-xl border p-4 transition ${
                  canAfford
                    ? "border-rpg-gold/40 bg-rpg-gold/10 shadow-[0_0_24px_rgba(240,192,64,0.18)]"
                    : "border-[#1e1e3a] bg-[#0f0f1a] opacity-90"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] text-2xl">
                    {r.emoji}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setRewardForm({
                          id: r.id,
                          title: r.title,
                          description: r.description ?? "",
                          xpCost: r.xpCost,
                          emoji: r.emoji,
                        });
                        setRewardOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteReward(r.id);
                          toast.success(t("rewardDeleted"));
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="size-4 text-rpg-red" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 font-heading text-base text-rpg-text">{r.title}</p>
                {r.description ? <p className="mt-1 text-xs text-rpg-secondary">{r.description}</p> : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-rpg-gold">{t("xpCost", { cost: r.xpCost })}</span>
                  {canAfford ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      className="border-rpg-gold/40 bg-rpg-gold text-[#0a0a0f] hover:bg-rpg-gold/90"
                      onClick={() => redeemReward(r.id)}
                    >
                      {t("redeem")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-rpg-secondary">
                      <Lock className="size-3.5" />
                      {t("locked")} · {t("xpCost", { cost: r.xpCost })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {redeemedRewards.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-heading text-base text-rpg-heading">{t("redeemedSection")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {redeemedRewards.map((r) => (
                <div
                  key={r.id}
                  className="relative overflow-hidden rounded-xl border border-rpg-green/30 bg-rpg-green/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] text-2xl">
                      {r.emoji}
                    </div>
                    <span className="rounded-full border border-rpg-green/40 bg-rpg-green/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rpg-green">
                      {t("redeemed")}
                    </span>
                  </div>
                  <p className="mt-3 font-heading text-base text-rpg-text">{r.title}</p>
                  {r.description ? <p className="mt-1 text-xs text-rpg-secondary">{r.description}</p> : null}
                  <p className="mt-3 text-xs text-rpg-secondary">
                    {t("xpCost", { cost: r.xpCost })}
                    {r.claimedAt ? ` · ${new Date(r.claimedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </RPGCard>

      <RPGCard glow="purple" className="p-5">
        <h2 className="font-heading text-lg text-rpg-heading">{t("dataExport")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const data = await exportUserData();
                downloadJson(data, "life-rpg-export.json");
                toast.success(t("exportSuccess"));
              })
            }
          >
            {t("exportJson")}
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const csv = await exportHabitLogsCsv();
                downloadText(csv, "habit-logs.csv");
                toast.success(t("exportSuccess"));
              })
            }
          >
            {t("exportCsv")}
          </Button>
        </div>
      </RPGCard>

      <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
        <DialogContent className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rewardForm.id ? t("editReward") : t("addReward")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("rewardTitle")}</Label><Input value={rewardForm.title} onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })} /></div>
            <div><Label>{t("rewardDescription")}</Label><Textarea value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} /></div>
            <div><Label>{t("xpCostLabel")}</Label><Input type="number" min={1} value={rewardForm.xpCost} onChange={(e) => setRewardForm({ ...rewardForm, xpCost: Number(e.target.value) })} /></div>
            <div><Label>{t("emojiPicker")}</Label><Input value={rewardForm.emoji} onChange={(e) => setRewardForm({ ...rewardForm, emoji: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardOpen(false)}>{tc("cancel")}</Button>
            <Button
              disabled={pending || !rewardForm.title}
              onClick={() =>
                startTransition(async () => {
                  if (rewardForm.id) await updateReward(rewardForm);
                  else await createReward(rewardForm);
                  toast.success(t("rewardSaved"));
                  setRewardOpen(false);
                  router.refresh();
                })
              }
            >
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(timeEdit)} onOpenChange={() => setTimeEdit(null)}>
        <DialogContent className="border-[#1e1e3a] bg-[#0f0f1a] sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("editReminderTime")}</DialogTitle></DialogHeader>
          <Input type="time" value={timeEdit?.time ?? "09:00"} onChange={(e) => setTimeEdit((prev) => (prev ? { ...prev, time: e.target.value } : prev))} />
          <DialogFooter>
            <Button
              disabled={pending || !timeEdit}
              onClick={() =>
                startTransition(async () => {
                  if (!timeEdit) return;
                  await updateNotificationTime(timeEdit);
                  toast.success(t("notificationUpdated"));
                  setTimeEdit(null);
                  router.refresh();
                })
              }
            >
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

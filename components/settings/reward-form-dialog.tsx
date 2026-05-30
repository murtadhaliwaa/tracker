"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
  REWARD_ACCENT,
  REWARD_EMOJI_CATEGORIES,
  REWARD_XP_PRESETS,
  emptyRewardForm,
  type RewardFormValues,
} from "@/lib/reward-display";
import { createReward, updateReward } from "@/app/[locale]/(protected)/settings/actions";

type RewardSaved = {
  id: string;
  title: string;
  description: string | null;
  xpCost: number;
  emoji: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RewardFormValues | null;
  onSaved: (reward: RewardSaved) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

function getEmojiCategoryLabel(
  t: ReturnType<typeof useTranslations<"settings">>,
  id: (typeof REWARD_EMOJI_CATEGORIES)[number]["id"],
): string {
  switch (id) {
    case "treats":
      return t("emojiCatTreats");
    case "food":
      return t("emojiCatFood");
    case "fun":
      return t("emojiCatFun");
    case "travel":
      return t("emojiCatTravel");
    case "wellness":
      return t("emojiCatWellness");
    case "luxury":
      return t("emojiCatLuxury");
    default:
      return id;
  }
}

export function RewardFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [form, setForm] = useState<RewardFormValues>(initial ?? emptyRewardForm);
  const [emojiCategory, setEmojiCategory] = useState<string>("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initial ?? emptyRewardForm);
    setEmojiCategory("all");
  }, [initial, open]);

  const visibleEmojis = useMemo(() => {
    if (emojiCategory === "all") {
      return REWARD_EMOJI_CATEGORIES.flatMap((category) => category.emojis);
    }
    return REWARD_EMOJI_CATEGORIES.find((category) => category.id === emojiCategory)?.emojis ?? [];
  }, [emojiCategory]);

  const submit = () => {
    startTransition(async () => {
      try {
        let saved: RewardSaved;
        if (form.id) {
          await updateReward(form);
          saved = {
            id: form.id,
            title: form.title.trim(),
            description: form.description.trim() || null,
            xpCost: form.xpCost,
            emoji: form.emoji,
          };
        } else {
          saved = (await createReward(form)).reward;
        }

        toast.success(t("rewardSaved"));
        onOpenChange(false);
        onSaved(saved);
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">
            {form.id ? t("editReward") : t("addReward")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${REWARD_ACCENT}66`,
              background: `linear-gradient(135deg, ${REWARD_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border text-2xl"
              style={{ borderColor: `${REWARD_ACCENT}88`, background: "#0f0f1a" }}
            >
              {form.emoji || "🎁"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base text-rpg-text" dir="auto">
                {form.title.trim() || t("previewPlaceholder")}
              </p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                {t("xpCost", { cost: form.xpCost })}
                {form.description.trim() ? ` · ${form.description.trim()}` : ""}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionBasics")}>
            <div>
              <Label htmlFor="reward-title">{t("rewardTitle")}</Label>
              <Input
                id="reward-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("titlePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="reward-description">{t("rewardDescription")}</Label>
              <Textarea
                id="reward-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-[72px] border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionCost")}>
            <div>
              <Label>{t("xpCostLabel")}</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {REWARD_XP_PRESETS.map((cost) => (
                  <button
                    key={cost}
                    type="button"
                    onClick={() => setForm({ ...form, xpCost: cost })}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition",
                      form.xpCost === cost
                        ? "border-rpg-gold/50 bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] text-rpg-secondary hover:border-rpg-gold/30",
                    )}
                  >
                    {t("xpCost", { cost })}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="reward-xp-custom">{t("xpCostCustom")}</Label>
              <Input
                id="reward-xp-custom"
                type="number"
                min={1}
                value={form.xpCost}
                onChange={(e) => setForm({ ...form, xpCost: Number(e.target.value) || 1 })}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionAppearance")}>
            <div>
              <Label>{t("emojiPicker")}</Label>
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
                {REWARD_EMOJI_CATEGORIES.map((category) => (
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
                    {getEmojiCategoryLabel(t, category.id)}
                  </button>
                ))}
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
                  {visibleEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      onClick={() => setForm({ ...form, emoji })}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg text-lg transition hover:bg-[#1e1e3a]",
                        form.emoji === emoji && "bg-rpg-gold/20 ring-1 ring-rpg-gold/70",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="reward-emoji-custom" className="text-xs text-rpg-secondary">
                  {t("emojiCustom")}
                </Label>
                <Input
                  id="reward-emoji-custom"
                  value={form.emoji}
                  maxLength={4}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <DialogFooter className="gap-2 border-t border-[#1e1e3a] bg-[#0c0c14] px-5 py-3 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button
            className="border-rpg-gold/40 bg-rpg-gold text-[#0a0a0f] hover:bg-rpg-gold/90"
            onClick={submit}
            disabled={pending || !form.title.trim() || form.xpCost < 1}
          >
            {pending ? t("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

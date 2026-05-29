"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Crown,
  Flame,
  Gem,
  Hammer,
  Pickaxe,
  ScrollText,
  Shield,
  Skull,
  Star,
  Sword,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlayerAvatar } from "@/components/gamification/player-avatar";
import { cn } from "@/lib/utils";
import {
  AVATAR_COLOR_OPTIONS,
  AVATAR_ICON_IDS,
  getPlayerDisplayName,
  parseAvatarStyle,
  serializeAvatarStyle,
  type AvatarColorId,
  type AvatarIconId,
} from "@/lib/player-profile";
import { updateProfile } from "@/app/[locale]/(protected)/profile/actions";

const PROFILE_ACCENT = "#f0c040";

function SpearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3v14M12 17l-2.5 4M12 17l2.5 4M9 7h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const avatarIconMap: Record<Exclude<AvatarIconId, "initials" | "spear">, LucideIcon> = {
  sword: Sword,
  shield: Shield,
  crown: Crown,
  flame: Flame,
  skull: Skull,
  wand: Wand2,
  gem: Gem,
  star: Star,
  scroll: ScrollText,
  axe: Pickaxe,
  hammer: Hammer,
  zap: Zap,
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

function getAvatarColorLabel(
  t: ReturnType<typeof useTranslations<"profile">>,
  id: AvatarColorId,
): string {
  switch (id) {
    case "purple-gold":
      return t("avatarColors.purple-gold");
    case "purple":
      return t("avatarColors.purple");
    case "gold":
      return t("avatarColors.gold");
    case "teal":
      return t("avatarColors.teal");
    case "crimson":
      return t("avatarColors.crimson");
    case "azure":
      return t("avatarColors.azure");
    case "emerald":
      return t("avatarColors.emerald");
    case "rose":
      return t("avatarColors.rose");
    case "amber":
      return t("avatarColors.amber");
    case "violet-night":
      return t("avatarColors.violet-night");
    case "sunset":
      return t("avatarColors.sunset");
    case "ocean":
      return t("avatarColors.ocean");
    case "forest":
      return t("avatarColors.forest");
    case "royal":
      return t("avatarColors.royal");
    case "midnight":
      return t("avatarColors.midnight");
    default:
      return id;
  }
}

function getAvatarIconLabel(
  t: ReturnType<typeof useTranslations<"profile">>,
  id: AvatarIconId,
): string {
  switch (id) {
    case "initials":
      return t("avatarIcons.initials");
    case "sword":
      return t("avatarIcons.sword");
    case "spear":
      return t("avatarIcons.spear");
    case "shield":
      return t("avatarIcons.shield");
    case "crown":
      return t("avatarIcons.crown");
    case "flame":
      return t("avatarIcons.flame");
    case "skull":
      return t("avatarIcons.skull");
    case "wand":
      return t("avatarIcons.wand");
    case "gem":
      return t("avatarIcons.gem");
    case "star":
      return t("avatarIcons.star");
    case "scroll":
      return t("avatarIcons.scroll");
    case "axe":
      return t("avatarIcons.axe");
    case "hammer":
      return t("avatarIcons.hammer");
    case "zap":
      return t("avatarIcons.zap");
    default:
      return id;
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string | null;
  avatarStyle: string | null;
  level: number;
  title: string;
  onSaved: () => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
  name,
  avatarStyle,
  level,
  title,
  onSaved,
}: Props) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const parsed = parseAvatarStyle(avatarStyle);
  const [formName, setFormName] = useState(name ?? "");
  const [formColor, setFormColor] = useState<AvatarColorId>(parsed.colorId);
  const [formIcon, setFormIcon] = useState<AvatarIconId>(parsed.iconId);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const next = parseAvatarStyle(avatarStyle);
    setFormName(name ?? "");
    setFormColor(next.colorId);
    setFormIcon(next.iconId);
  }, [open, name, avatarStyle]);

  const previewAvatarStyle = serializeAvatarStyle(formColor, formIcon);
  const displayName = getPlayerDisplayName(formName, t("playerFallback"));
  const previewName = formName.trim() || t("previewPlaceholder");
  const selectedIconLabel = getAvatarIconLabel(t, formIcon);
  const selectedColorLabel = getAvatarColorLabel(t, formColor);

  const submit = () => {
    startTransition(async () => {
      try {
        await updateProfile({
          name: formName.trim(),
          avatarColor: formColor,
          avatarIcon: formIcon,
          avatarStyle: previewAvatarStyle,
        });
        toast.success(t("profileSaved"));
        onOpenChange(false);
        onSaved();
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">{t("editProfile")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${PROFILE_ACCENT}66`,
              background: `linear-gradient(135deg, ${PROFILE_ACCENT}18, transparent)`,
            }}
          >
            <PlayerAvatar name={formName || displayName} avatarStyle={previewAvatarStyle} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base text-rpg-text" dir="auto">
                {previewName}
              </p>
              <p className="mt-0.5 text-xs text-rpg-secondary">
                {t("levelTitle", { level, title })}
              </p>
              <p className="mt-0.5 text-[11px] text-rpg-muted">
                {selectedIconLabel} · {selectedColorLabel}
              </p>
            </div>
          </div>

          <FormSection title={t("sectionBasics")}>
            <div>
              <Label htmlFor="profile-name">{t("nameLabel")}</Label>
              <Input
                id="profile-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 border-[#1e1e3a] bg-[#0f0f1a]"
                placeholder={t("namePlaceholder")}
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionAppearance")}>
            <div>
              <Label>{t("avatarColor")}</Label>
              <div className="mt-2 rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                  {AVATAR_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={getAvatarColorLabel(t, color.id)}
                      title={getAvatarColorLabel(t, color.id)}
                      onClick={() => setFormColor(color.id)}
                      className={cn(
                        "size-9 rounded-full border-2 transition hover:scale-105 sm:size-10",
                        formColor === color.id ? "border-rpg-gold scale-105" : "border-transparent",
                      )}
                      style={{ background: color.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>{t("avatarIcon")}</Label>
              <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-2">
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
                  {AVATAR_ICON_IDS.map((iconId) => {
                    const Icon =
                      iconId === "spear"
                        ? SpearIcon
                        : iconId === "initials"
                          ? null
                          : avatarIconMap[iconId];
                    return (
                      <button
                        key={iconId}
                        type="button"
                        aria-label={getAvatarIconLabel(t, iconId)}
                        title={getAvatarIconLabel(t, iconId)}
                        onClick={() => setFormIcon(iconId)}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-lg border text-rpg-text transition hover:bg-[#1e1e3a]",
                          formIcon === iconId
                            ? "border-rpg-gold/70 bg-rpg-gold/15 ring-1 ring-rpg-gold/70"
                            : "border-[#1e1e3a] bg-[#13131f]",
                        )}
                      >
                        {iconId === "initials" ? (
                          <span className="text-xs font-bold">Aa</span>
                        ) : Icon ? (
                          <Icon className="size-5" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
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
            disabled={pending || !formName.trim()}
          >
            {pending ? t("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

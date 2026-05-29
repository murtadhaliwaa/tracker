export const AVATAR_COLOR_OPTIONS = [
  { id: "purple-gold", value: "linear-gradient(135deg, #7C3AED, #D4AF37)" },
  { id: "purple", value: "#7C3AED" },
  { id: "gold", value: "#D4AF37" },
  { id: "teal", value: "#14b8a6" },
  { id: "crimson", value: "#dc2626" },
  { id: "azure", value: "#2563eb" },
  { id: "emerald", value: "#059669" },
  { id: "rose", value: "#e11d48" },
  { id: "amber", value: "#d97706" },
  { id: "violet-night", value: "linear-gradient(135deg, #4c1d95, #1e1b4b)" },
  { id: "sunset", value: "linear-gradient(135deg, #f97316, #dc2626)" },
  { id: "ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { id: "forest", value: "linear-gradient(135deg, #16a34a, #14532d)" },
  { id: "royal", value: "linear-gradient(135deg, #7c3aed, #db2777)" },
  { id: "midnight", value: "linear-gradient(135deg, #1e293b, #64748b)" },
] as const;

export const AVATAR_ICON_IDS = [
  "initials",
  "sword",
  "spear",
  "shield",
  "crown",
  "flame",
  "skull",
  "wand",
  "gem",
  "star",
  "scroll",
  "axe",
  "hammer",
  "zap",
] as const;

export type AvatarIconId = (typeof AVATAR_ICON_IDS)[number];
export type AvatarColorId = (typeof AVATAR_COLOR_OPTIONS)[number]["id"];

const STYLE_SEP = "|";

export function parseAvatarStyle(avatarStyle: string | null | undefined): {
  colorId: AvatarColorId;
  iconId: AvatarIconId;
} {
  const defaultColor = AVATAR_COLOR_OPTIONS[0].id;
  if (!avatarStyle) {
    return { colorId: defaultColor, iconId: "initials" };
  }

  if (avatarStyle.includes(STYLE_SEP)) {
    const [colorId, iconId = "initials"] = avatarStyle.split(STYLE_SEP);
    return {
      colorId: resolveColorId(colorId),
      iconId: resolveIconId(iconId),
    };
  }

  return {
    colorId: resolveColorId(avatarStyle),
    iconId: "initials",
  };
}

export function serializeAvatarStyle(colorId: string, iconId: string): string {
  const resolvedColor = resolveColorId(colorId);
  const resolvedIcon = resolveIconId(iconId);
  if (resolvedIcon === "initials") return resolvedColor;
  return `${resolvedColor}${STYLE_SEP}${resolvedIcon}`;
}

export function isValidAvatarStyle(avatarStyle: string): boolean {
  const { colorId, iconId } = parseAvatarStyle(avatarStyle);
  const colorOk = AVATAR_COLOR_OPTIONS.some((c) => c.id === colorId);
  const iconOk = AVATAR_ICON_IDS.includes(iconId);
  return colorOk && iconOk;
}

function resolveColorId(value: string | undefined): AvatarColorId {
  const byId = AVATAR_COLOR_OPTIONS.find((o) => o.id === value);
  if (byId) return byId.id;
  const byValue = AVATAR_COLOR_OPTIONS.find((o) => o.value === value);
  return byValue?.id ?? AVATAR_COLOR_OPTIONS[0].id;
}

function resolveIconId(value: string | undefined): AvatarIconId {
  if (value && AVATAR_ICON_IDS.includes(value as AvatarIconId)) {
    return value as AvatarIconId;
  }
  return "initials";
}

export function getAvatarBackground(avatarStyle: string | null | undefined): string {
  const { colorId } = parseAvatarStyle(avatarStyle);
  const match = AVATAR_COLOR_OPTIONS.find((o) => o.id === colorId);
  return match?.value ?? AVATAR_COLOR_OPTIONS[0].value;
}

export function getPlayerDisplayName(name: string | null | undefined, fallback: string): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function getPlayerInitials(name: string | null | undefined): string {
  const display = name?.trim();
  if (!display) return "?";
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return display.slice(0, 2).toUpperCase();
}

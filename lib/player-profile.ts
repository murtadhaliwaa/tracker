export const AVATAR_COLOR_OPTIONS = [
  { id: "purple-gold", value: "linear-gradient(135deg, #7C3AED, #D4AF37)" },
  { id: "purple", value: "#7C3AED" },
  { id: "gold", value: "#D4AF37" },
] as const;

export function getAvatarBackground(avatarStyle: string | null | undefined): string {
  const match = AVATAR_COLOR_OPTIONS.find((o) => o.id === avatarStyle);
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

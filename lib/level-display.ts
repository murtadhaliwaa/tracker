export const LEVEL_TITLE_KEYS = [
  "Novice",
  "Seeker",
  "Scholar",
  "Adept",
  "Expert",
  "Master",
  "Legend",
  "Champion",
  "Sage",
] as const;

export type LevelTitleKey = (typeof LEVEL_TITLE_KEYS)[number];

export function isLevelTitleKey(value: string): value is LevelTitleKey {
  return (LEVEL_TITLE_KEYS as readonly string[]).includes(value);
}

export function translateLevelTitle(
  t: (key: LevelTitleKey) => string,
  title: string,
): string {
  if (!isLevelTitleKey(title)) return title;
  return t(title);
}

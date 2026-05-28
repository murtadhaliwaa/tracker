export function getCharacterTitle(level: number): string {
  if (level >= 25) return "Legend";
  if (level >= 20) return "Master";
  if (level >= 15) return "Expert";
  if (level >= 10) return "Adept";
  if (level >= 5) return "Apprentice";
  return "Novice";
}

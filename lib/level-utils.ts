const BASE_THRESHOLDS = [0, 500, 1000, 2000, 3500, 5500, 8000, 11000];

const LEVEL_TITLES = [
  "Novice",
  "Seeker",
  "Scholar",
  "Adept",
  "Expert",
  "Master",
  "Legend",
  "Champion",
] as const;

export function getThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level - 1 < BASE_THRESHOLDS.length) return BASE_THRESHOLDS[level - 1]!;
  let threshold = BASE_THRESHOLDS[BASE_THRESHOLDS.length - 1]!;
  for (let l = BASE_THRESHOLDS.length; l < level; l++) {
    threshold = Math.round(threshold * 1.4);
  }
  return threshold;
}

export function getLevelFromTotalXP(totalXP: number): number {
  let level = 1;
  for (let l = 2; ; l++) {
    const threshold = getThresholdForLevel(l);
    if (totalXP < threshold) return level;
    level = l;
    if (l > 100) return level;
  }
}

export function getLevelProgress(totalXP: number) {
  const level = getLevelFromTotalXP(totalXP);
  const currentThreshold = getThresholdForLevel(level);
  const nextThreshold = getThresholdForLevel(level + 1);
  return {
    level,
    currentXP: totalXP - currentThreshold,
    xpToNextLevel: nextThreshold - currentThreshold,
    totalXP,
  };
}

export function getTitleFromLevel(level: number): string {
  if (level <= 0) return LEVEL_TITLES[0];
  if (level <= LEVEL_TITLES.length) return LEVEL_TITLES[level - 1]!;
  return "Champion";
}

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.3;
  if (streakDays >= 14) return 1.2;
  if (streakDays >= 7) return 1.1;
  return 1;
}

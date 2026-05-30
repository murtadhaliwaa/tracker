"use client";

export type ShellStatsPatch = {
  playerName?: string | null;
  playerLevel?: number;
  playerTitle?: string;
  currentXP?: number;
  xpToNextLevel?: number;
  streakDays?: number;
  freezesAvailable?: number;
};

export const SHELL_STATS_EVENT = "shell-stats-updated";

export function dispatchShellStats(patch: ShellStatsPatch) {
  window.dispatchEvent(new CustomEvent(SHELL_STATS_EVENT, { detail: patch }));
}

export function patchShellFromAward(result: {
  newLevel: number;
  newTitle: string;
  currentXP?: number;
  xpToNextLevel?: number;
}) {
  dispatchShellStats({
    playerLevel: result.newLevel,
    playerTitle: result.newTitle,
    ...(result.currentXP !== undefined ? { currentXP: result.currentXP } : {}),
    ...(result.xpToNextLevel !== undefined ? { xpToNextLevel: result.xpToNextLevel } : {}),
  });
}

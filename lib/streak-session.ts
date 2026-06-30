import { cache } from "react";
import { processMissedStreakDays } from "@/lib/streak-engine";

/** Runs missed-streak processing once per request on key entry pages (not every layout load). */
export const resolveSessionStreak = cache(async (userId: string) => {
  const streak = await processMissedStreakDays(userId);
  return {
    currentStreak: streak?.currentStreak ?? 0,
    freezesAvailable: streak?.freezesAvailable ?? 0,
  };
});

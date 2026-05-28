import { differenceInCalendarDays } from "date-fns";

export function nextStreakState(
  lastCompletedDate: Date | null,
  currentStreak: number,
  today: Date,
): { streak: number; missedDays: number } {
  if (!lastCompletedDate) {
    return { streak: 1, missedDays: 0 };
  }

  const daysDiff = differenceInCalendarDays(today, lastCompletedDate);
  if (daysDiff <= 0) {
    return { streak: currentStreak, missedDays: 0 };
  }
  if (daysDiff === 1) {
    return { streak: currentStreak + 1, missedDays: 0 };
  }

  return { streak: 1, missedDays: daysDiff - 1 };
}

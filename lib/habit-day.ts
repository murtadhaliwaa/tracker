import { startOfDay } from "date-fns";

export function getTodayStart(): Date {
  return startOfDay(new Date());
}

export function isLogFromToday(logDate: Date | null | undefined): boolean {
  if (!logDate) return false;
  return startOfDay(logDate).getTime() === getTodayStart().getTime();
}

export const todayLogFilter = () => ({
  date: getTodayStart(),
  completed: true,
});

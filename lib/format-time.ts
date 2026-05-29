/** Converts "HH:mm" (24h) to "h:mm AM/PM". */
export function formatTimeAmPm(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  if (hours < 0 || hours > 23) return time;

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${period}`;
}

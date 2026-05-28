export function habitIconDisplay(icon: string): string {
  switch (icon) {
    case "Lotus":
      return "🪷";
    case "Book":
      return "📖";
    case "Dumbbell":
      return "🏋️";
    case "Scroll":
      return "📜";
    default: {
      const graphemes = [...icon];
      return graphemes.length <= 2 ? icon : "⚔";
    }
  }
}

export type HabitFrequency =
  | { type: "daily" }
  | { type: "specific_days"; days: string[] }
  | { type: "times_per_week"; count: number }
  | { type: "once_per_month" }
  | { type: "once_per_year" };

/** Stored on habits; UI always renders purple left border per design system */
export const HABIT_BORDER_COLOR = "#7C3AED";

export const COLOR_SWATCHES = [
  { name: "purple", value: "#7C3AED" },
  { name: "gold", value: "#D4AF37" },
] as const;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

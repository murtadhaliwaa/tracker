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

/** Default accent when a habit has no color set */
export const HABIT_BORDER_COLOR = "#7C3AED";

export const COLOR_SWATCHES = [
  { name: "purple", value: "#7C3AED" },
  { name: "gold", value: "#D4AF37" },
  { name: "blue", value: "#3B82F6" },
  { name: "green", value: "#22C55E" },
  { name: "red", value: "#EF4444" },
  { name: "orange", value: "#F97316" },
  { name: "pink", value: "#EC4899" },
  { name: "cyan", value: "#06B6D4" },
  { name: "indigo", value: "#6366F1" },
] as const;

export const HABIT_EMOJI_CATEGORIES = [
  {
    id: "rpg",
    emojis: ["⚔️", "🛡️", "👑", "💎", "⭐", "🔮", "🗡️", "🏹", "🪓", "🔨", "🎯", "🔥", "✨", "🌟"],
  },
  {
    id: "fitness",
    emojis: ["🏋️", "💪", "🏃", "🚴", "🧘", "🥊", "⚽", "🏊", "🚶", "🤸", "🧗", "🎾", "🏀", "🥾"],
  },
  {
    id: "mind",
    emojis: ["🧠", "🪷", "🧘‍♂️", "💭", "📿", "🕯️", "😌", "🌸", "☮️", "🫧"],
  },
  {
    id: "learning",
    emojis: ["📖", "📚", "✍️", "🎓", "💡", "📝", "📜", "🔬", "🧪", "🖊️", "📰", "🗣️"],
  },
  {
    id: "health",
    emojis: ["💧", "🥗", "😴", "💊", "🦷", "🌿", "🍎", "🥦", "🧴", "❤️‍🩹"],
  },
  {
    id: "productivity",
    emojis: ["✅", "📋", "⏱️", "📅", "💼", "🖥️", "📧", "🗂️", "⌨️", "🔔"],
  },
  {
    id: "lifestyle",
    emojis: ["🎨", "🎵", "🎮", "📷", "🍳", "🧹", "🛏️", "🐕", "🌅", "🌙", "☀️", "🌱", "🤝", "💬"],
  },
] as const;

export const HABIT_EMOJIS = [
  ...new Set(HABIT_EMOJI_CATEGORIES.flatMap((category) => category.emojis)),
];

const ACCENT_PALETTE = COLOR_SWATCHES.map((s) => s.value);

/** Gives each habit a distinct border when several share the same stored color. */
export function habitAccentColor(
  habits: { id: string; color: string }[],
  habitId: string,
): string {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return HABIT_BORDER_COLOR;

  const normalized = habit.color.toLowerCase();
  const sameColor = habits.filter((h) => h.color.toLowerCase() === normalized);
  if (sameColor.length <= 1) return habit.color;

  const sorted = [...sameColor].sort((a, b) => a.id.localeCompare(b.id));
  const idx = sorted.findIndex((h) => h.id === habitId);
  return ACCENT_PALETTE[idx % ACCENT_PALETTE.length] ?? habit.color;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

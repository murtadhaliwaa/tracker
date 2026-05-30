export const ONBOARDING_HABIT_PRESETS = [
  { key: "meditation", title: "Morning Meditation", icon: "Lotus", color: "#7c3aed" },
  { key: "reading", title: "Daily Reading", icon: "Book", color: "#3b82f6" },
  { key: "exercise", title: "Exercise", icon: "Dumbbell", color: "#ef4444" },
  { key: "water", title: "Drink Water", icon: "💧", color: "#06b6d4" },
  { key: "learn", title: "Learn Something New", icon: "📚", color: "#f59e0b" },
  { key: "sleep", title: "Sleep by 11pm", icon: "🌙", color: "#6366f1" },
] as const;

export type OnboardingPresetKey = (typeof ONBOARDING_HABIT_PRESETS)[number]["key"];

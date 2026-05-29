export const COURSE_CATEGORY_OPTIONS = [
  { value: "programming", legacy: "Programming" },
  { value: "language", legacy: "Language" },
  { value: "science", legacy: "Science" },
  { value: "business", legacy: "Business" },
  { value: "art", legacy: "Art" },
  { value: "mathematics", legacy: "Mathematics" },
  { value: "history", legacy: "History" },
  { value: "philosophy", legacy: "Philosophy" },
  { value: "psychology", legacy: "Psychology" },
  { value: "health", legacy: "Health" },
  { value: "fitness", legacy: "Fitness" },
  { value: "music", legacy: "Music" },
  { value: "design", legacy: "Design" },
  { value: "writing", legacy: "Writing" },
  { value: "finance", legacy: "Finance" },
  { value: "marketing", legacy: "Marketing" },
  { value: "leadership", legacy: "Leadership" },
  { value: "selfImprovement", legacy: "Self Improvement" },
  { value: "technology", legacy: "Technology" },
  { value: "dataScience", legacy: "Data Science" },
  { value: "cooking", legacy: "Cooking" },
  { value: "photography", legacy: "Photography" },
  { value: "law", legacy: "Law" },
  { value: "medicine", legacy: "Medicine" },
  { value: "other", legacy: "Other" },
] as const;

export type CourseCategoryValue = (typeof COURSE_CATEGORY_OPTIONS)[number]["value"];

export const COURSE_ICONS = [
  "📚",
  "🎓",
  "💻",
  "🧠",
  "📊",
  "🎨",
  "🌍",
  "🔬",
  "⚖️",
  "🎵",
  "🏋️",
  "💰",
  "🗣️",
  "✍️",
  "🧪",
  "🔧",
  "📐",
  "🎬",
  "🏛️",
  "💡",
  "🚀",
  "🌱",
  "❤️",
  "⚡",
  "🎯",
  "🔭",
  "📱",
  "🛠️",
  "🧘",
  "📝",
  "🗺️",
  "🎮",
  "🧮",
  "🔐",
  "🌐",
  "📈",
  "🎤",
  "🏆",
  "🧑‍💻",
  "📖",
] as const;

export const COURSE_ICON_CATEGORIES = [
  {
    id: "education",
    emojis: ["📚", "🎓", "📖", "🔭", "🧮", "🏛️"],
  },
  {
    id: "tech",
    emojis: ["💻", "🧑‍💻", "📱", "🛠️", "🔐", "🌐", "🔧", "📊", "📈"],
  },
  {
    id: "science",
    emojis: ["🔬", "🧪", "📐", "🧠", "⚡"],
  },
  {
    id: "creative",
    emojis: ["🎨", "🎵", "🎬", "✍️", "🎤", "🎮", "💡"],
  },
  {
    id: "life",
    emojis: ["🧘", "❤️", "🌱", "🏋️", "🗣️", "🗺️", "🎯", "🏆"],
  },
  {
    id: "world",
    emojis: ["🌍", "⚖️", "💰", "🚀", "📝"],
  },
] as const;

export type CourseIconCategoryId = (typeof COURSE_ICON_CATEGORIES)[number]["id"];

export const COURSE_ACCENT = "#7C3AED";

export function resolveCourseCategoryValue(category: string | null | undefined): CourseCategoryValue | null {
  if (!category) return null;
  const match = COURSE_CATEGORY_OPTIONS.find(
    (option) => option.value === category || option.legacy === category,
  );
  return match?.value ?? null;
}

type CourseCategoryTranslate = (
  key:
    | "categories.programming"
    | "categories.language"
    | "categories.science"
    | "categories.business"
    | "categories.art"
    | "categories.mathematics"
    | "categories.history"
    | "categories.philosophy"
    | "categories.psychology"
    | "categories.health"
    | "categories.fitness"
    | "categories.music"
    | "categories.design"
    | "categories.writing"
    | "categories.finance"
    | "categories.marketing"
    | "categories.leadership"
    | "categories.selfImprovement"
    | "categories.technology"
    | "categories.dataScience"
    | "categories.cooking"
    | "categories.photography"
    | "categories.law"
    | "categories.medicine"
    | "categories.other",
) => string;

export function getCourseCategoryLabels(t: CourseCategoryTranslate): Record<CourseCategoryValue, string> {
  return {
    programming: t("categories.programming"),
    language: t("categories.language"),
    science: t("categories.science"),
    business: t("categories.business"),
    art: t("categories.art"),
    mathematics: t("categories.mathematics"),
    history: t("categories.history"),
    philosophy: t("categories.philosophy"),
    psychology: t("categories.psychology"),
    health: t("categories.health"),
    fitness: t("categories.fitness"),
    music: t("categories.music"),
    design: t("categories.design"),
    writing: t("categories.writing"),
    finance: t("categories.finance"),
    marketing: t("categories.marketing"),
    leadership: t("categories.leadership"),
    selfImprovement: t("categories.selfImprovement"),
    technology: t("categories.technology"),
    dataScience: t("categories.dataScience"),
    cooking: t("categories.cooking"),
    photography: t("categories.photography"),
    law: t("categories.law"),
    medicine: t("categories.medicine"),
    other: t("categories.other"),
  };
}

export function getCourseCategoryLabel(
  category: string | null | undefined,
  labels: Record<CourseCategoryValue, string>,
): string {
  if (!category) return "";
  const resolved = resolveCourseCategoryValue(category);
  if (resolved) return labels[resolved];
  return category;
}

export const LIFE_BALANCE_DIMENSIONS = [
  "mind",
  "body",
  "knowledge",
  "discipline",
  "social",
  "spirituality",
  "career",
  "creativity",
  "health",
  "rest",
] as const;

export type LifeBalanceDimension = (typeof LIFE_BALANCE_DIMENSIONS)[number];

export type LifeBalanceRadarPoint = {
  subject: LifeBalanceDimension;
  value: number;
};

const DIMENSION_ALIASES: Record<LifeBalanceDimension, string[]> = {
  mind: ["mind", "mental", "meditation", "focus", "العقل", "ذهن", "تأمل"],
  body: ["body", "fitness", "workout", "exercise", "sport", "الجسم", "رياضة", "لياقة"],
  knowledge: ["knowledge", "learning", "study", "reading", "education", "المعرفة", "تعلم", "قراءة"],
  discipline: ["discipline", "habits", "routine", "productivity", "الانضباط", "انضباط", "عادات"],
  social: ["social", "relationships", "family", "friends", "community", "اجتماعي", "علاقات", "عائلة"],
  spirituality: ["spirituality", "spiritual", "faith", "prayer", "روحانية", "إيمان", "صلاة"],
  career: ["career", "work", "professional", "job", "business", "مهنة", "عمل", "وظيفة"],
  creativity: ["creativity", "creative", "art", "music", "writing", "إبداع", "فن", "كتابة"],
  health: ["health", "wellness", "nutrition", "hydration", "water", "صحة", "تغذية", "ماء"],
  rest: ["rest", "sleep", "recovery", "relax", "راحة", "نوم", "استرخاء"],
};

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function resolveLifeBalanceDimension(
  categoryName: string | null | undefined,
): LifeBalanceDimension | null {
  if (!categoryName?.trim()) return null;

  const normalized = normalizeCategoryName(categoryName);

  if (LIFE_BALANCE_DIMENSIONS.includes(normalized as LifeBalanceDimension)) {
    return normalized as LifeBalanceDimension;
  }

  for (const dimension of LIFE_BALANCE_DIMENSIONS) {
    const aliases = DIMENSION_ALIASES[dimension];
    if (aliases.some((alias) => normalizeCategoryName(alias) === normalized)) {
      return dimension;
    }
  }

  for (const dimension of LIFE_BALANCE_DIMENSIONS) {
    const aliases = DIMENSION_ALIASES[dimension];
    if (
      aliases.some(
        (alias) =>
          normalized.includes(normalizeCategoryName(alias)) ||
          normalizeCategoryName(alias).includes(normalized),
      )
    ) {
      return dimension;
    }
  }

  return null;
}

export function buildLifeBalanceRadar(
  habits: { id: string; categoryId: string | null; category: string | null }[],
  categories: { id: string; name: string }[],
  logs: { habitId: string }[],
): LifeBalanceRadarPoint[] {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const counts = new Map<LifeBalanceDimension, number>(
    LIFE_BALANCE_DIMENSIONS.map((dimension) => [dimension, 0]),
  );

  for (const log of logs) {
    const habit = habits.find((item) => item.id === log.habitId);
    if (!habit) continue;

    const categoryName =
      habit.category ??
      (habit.categoryId ? categoryNameById.get(habit.categoryId) ?? null : null);
    const dimension = resolveLifeBalanceDimension(categoryName);
    if (!dimension) continue;

    counts.set(dimension, (counts.get(dimension) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values(), 1);
  const emptyBaseline = 18;

  return LIFE_BALANCE_DIMENSIONS.map((dimension) => {
    const totalLogs = counts.get(dimension) ?? 0;
    if (totalLogs === 0) {
      return { subject: dimension, value: emptyBaseline };
    }

    const scaled = Math.round((totalLogs / maxCount) * 100);
    return {
      subject: dimension,
      value: Math.max(28, Math.min(100, scaled)),
    };
  });
}

export const DEFAULT_LIFE_BALANCE_CATEGORIES = [
  { name: "Mind", color: "#06b6d4" },
  { name: "Body", color: "#22c55e" },
  { name: "Knowledge", color: "#a78bfa" },
  { name: "Discipline", color: "#f59e0b" },
  { name: "Social", color: "#ec4899" },
  { name: "Spirituality", color: "#8b5cf6" },
  { name: "Career", color: "#3b82f6" },
  { name: "Creativity", color: "#f97316" },
  { name: "Health", color: "#10b981" },
  { name: "Rest", color: "#6366f1" },
] as const;

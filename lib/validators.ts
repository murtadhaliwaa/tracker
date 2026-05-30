import { z } from "zod";

export const frequencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({ type: z.literal("specific_days"), days: z.array(z.string()).min(1) }),
  z.object({ type: z.literal("times_per_week"), count: z.number().int().min(1).max(7) }),
  z.object({ type: z.literal("once_per_month") }),
  z.object({ type: z.literal("once_per_year") }),
]);

export const habitFormSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  frequency: frequencySchema,
  logType: z.enum(["CHECKBOX", "FORM", "TIMER"]),
  categoryName: z.string().min(1).max(60),
  xpValue: z.number().int().min(1).max(1000),
  icon: z.string().min(1).max(10),
  color: z.string().min(3).max(32),
});

export const habitOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      order: z.number().int().min(0),
    }),
  ),
});

export const habitLogSchema = z.object({
  habitId: z.string().cuid(),
  date: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(0).optional(),
  logType: z.enum(["CHECKBOX", "FORM", "TIMER"]),
  deepFocus: z.boolean().optional(),
  recoveryQuest: z.boolean().optional(),
});

export const meditationSessionSchema = z.object({
  type: z.string().min(1).max(60).optional(),
  duration: z.number().int().min(1).max(600),
  notes: z.string().max(1000).optional(),
  deepFocus: z.boolean().optional(),
  date: z.coerce.date().optional(),
});

export const readingSessionSchema = z.object({
  bookTitle: z.string().min(1).max(200),
  pagesRead: z.number().int().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  date: z.coerce.date().optional(),
});

export const courseFormSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(60).optional(),
  icon: z.string().min(1).max(32).default("📚"),
  totalLessons: z.number().int().min(1).max(10000),
  provider: z.string().max(100).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  xpReward: z.number().int().min(1).max(100000).optional(),
  prerequisiteCourseId: z.string().cuid().nullable().optional(),
});

export const weeklyReviewSchema = z.object({
  weekRating: z.number().int().min(1).max(5),
  winOfWeek: z.string().min(1).max(2000),
  challengeFaced: z.string().min(1).max(2000),
  lessonLearned: z.string().min(1).max(2000),
  nextWeekGoal: z.string().min(1).max(2000),
});

export const updateWeeklyReviewSchema = weeklyReviewSchema.extend({
  id: z.string().cuid(),
});

export const rewardFormSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  xpCost: z.number().int().min(1).max(100000),
  emoji: z.string().min(1).max(10).default("🎁"),
});

export const notificationToggleSchema = z.object({
  id: z.string().cuid(),
  enabled: z.boolean(),
});

export const notificationTimeSchema = z.object({
  id: z.string().cuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const languageSchema = z.object({
  language: z.enum(["en", "ar"]),
});

export const updateHabitSchema = habitFormSchema.extend({ id: z.string().cuid() });
export const updateCourseSchema = courseFormSchema.extend({ id: z.string().cuid() });
export const updateRewardSchema = rewardFormSchema.extend({ id: z.string().cuid() });

export const todoFormSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(["NORMAL", "HIGH"]).default("NORMAL"),
});

export const updateTodoSchema = todoFormSchema.extend({ id: z.string().cuid() });

export const recoveryQuestSchema = z.object({
  habitId: z.string().cuid(),
});

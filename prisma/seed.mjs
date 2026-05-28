import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay, startOfWeek, addDays, subWeeks } from "date-fns";

const prisma = new PrismaClient();

function isoDay(d) {
  return startOfDay(d);
}

async function main() {
  const email = "demo@liferpg.local";

  // Clean demo data (idempotent seed)
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      profile: {
        create: {
          level: 12,
          totalXP: 2450,
          currentXP: 250,
          xpToNextLevel: 500,
          title: "Scholar",
          preferredLanguage: "en"
        }
      },
      healthBar: {
        create: {
          currentHealth: 4,
          maxHealth: 5,
          isWounded: false
        }
      },
      habitCategories: {
        create: [
          { name: "Mind", color: "#06b6d4" },
          { name: "Body", color: "#22c55e" },
          { name: "Knowledge", color: "#a78bfa" },
          { name: "Discipline", color: "#f59e0b" }
        ]
      }
    },
    include: { habitCategories: true }
  });

  const cat = Object.fromEntries(user.habitCategories.map((c) => [c.name, c.id]));

  const habits = await prisma.habit.createMany({
    data: [
      {
        userId: user.id,
        title: "Meditate 10 minutes",
        description: "Breath focus + calm start",
        period: "DAILY",
        xpValue: 10,
        icon: "Lotus",
        color: "#06b6d4",
        categoryId: cat.Mind,
        frequency: { type: "daily" },
        order: 1
      },
      {
        userId: user.id,
        title: "Read 20 pages",
        description: "Keep the knowledge quest alive",
        period: "DAILY",
        xpValue: 20,
        icon: "Book",
        color: "#a78bfa",
        categoryId: cat.Knowledge,
        frequency: { type: "daily" },
        order: 2
      },
      {
        userId: user.id,
        title: "Workout",
        description: "Strength or cardio",
        period: "WEEKLY",
        xpValue: 40,
        icon: "Dumbbell",
        color: "#22c55e",
        categoryId: cat.Body,
        frequency: { type: "times_per_week", count: 3 },
        order: 3
      },
      {
        userId: user.id,
        title: "Weekly planning",
        description: "Set priorities and boss goals",
        period: "WEEKLY",
        xpValue: 30,
        icon: "Scroll",
        color: "#f59e0b",
        categoryId: cat.Discipline,
        frequency: { type: "day_of_week", days: ["Sun"] },
        order: 4
      }
    ]
  });

  const allHabits = await prisma.habit.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } });
  const [hMeditate, hRead, hWorkout] = allHabits;

  // Create streaks
  for (const h of allHabits) {
    await prisma.streak.create({
      data: {
        userId: user.id,
        habitId: h.id,
        currentStreak: h.id === hMeditate.id ? 8 : 3,
        longestStreak: h.id === hMeditate.id ? 14 : 7,
        lastCompletedDate: isoDay(subDays(new Date(), 1)),
        freezesAvailable: 2,
        freezesUsed: 0
      }
    });
  }

  // Overall daily streak (not tied to a single habit)
  await prisma.streak.create({
    data: {
      userId: user.id,
      habitId: null,
      currentStreak: 8,
      longestStreak: 14,
      lastCompletedDate: isoDay(subDays(new Date(), 1)),
      freezesAvailable: 2,
      freezesUsed: 0
    }
  });

  // Habit logs: last 12 weeks for heatmap + radar
  const today = isoDay(new Date());
  for (let daysAgo = 0; daysAgo < 84; daysAgo++) {
    const d = isoDay(subDays(today, daysAgo));
    if (daysAgo % 7 === 0) continue;

    await prisma.habitLog.create({
      data: {
        userId: user.id,
        habitId: hMeditate.id,
        date: d,
        logType: "TIMER",
        duration: 10,
        notes: "Steady breath",
      },
    });

    if (daysAgo % 3 !== 0) {
      await prisma.habitLog.create({
        data: {
          userId: user.id,
          habitId: hRead.id,
          date: d,
          logType: "FORM",
          duration: 20,
          notes: "Chapter progress",
        },
      });
    }
  }

  // Legacy 7-day block kept for streak variety on recent days
  const days = Array.from({ length: 7 }).map((_, i) => isoDay(subDays(today, i)));
  for (const d of days) {
    try {
      await prisma.habitLog.create({
        data: {
          userId: user.id,
          habitId: hWorkout.id,
          date: d,
          logType: "CHECKBOX",
          notes: "Training day",
        },
      });
    } catch {
      // ignore duplicate day entries
    }
  }

  // Weekly boss challenge
  await prisma.weeklyBossChallenge.create({
    data: {
      userId: user.id,
      title: "Boss: Calm Scholar",
      description: "Meditate 5 days + Read 3 days",
      targetValue: 8,
      currentValue: 6,
      xpReward: 200,
      weekNumber: 22,
      isCompleted: false
    }
  });

  // Courses
  const courseA = await prisma.course.create({
    data: {
      userId: user.id,
      title: "Next.js App Router Mastery",
      provider: "Self",
      totalLessons: 12,
      completedLessons: 5,
      priority: 8,
      difficulty: 3,
      xpReward: 100
    }
  });

  await prisma.course.create({
    data: {
      userId: user.id,
      title: "TypeScript Deep Dive",
      provider: "Self",
      totalLessons: 10,
      completedLessons: 2,
      priority: 10,
      difficulty: 4,
      xpReward: 100,
      prerequisiteCourseId: courseA.id
    }
  });

  // Achievements + rewards
  await prisma.achievement.createMany({
    data: [
      {
        userId: user.id,
        title: "First 7-day Streak",
        description: "Maintain a 7-day streak on any habit",
        icon: "Flame",
        unlockedAt: new Date()
      },
      {
        userId: user.id,
        title: "Perfect Day",
        description: "Complete all daily habits in one day",
        icon: "Crown"
      }
    ]
  });

  await prisma.rewardVault.createMany({
    data: [
      { userId: user.id, title: "New game purchase", description: "Buy a small indie game", requiredLevel: 15, isUnlocked: false },
      { userId: user.id, title: "Fancy coffee", description: "Treat yourself", requiredLevel: 10, isUnlocked: true, claimedAt: null }
    ]
  });

  // Reflections
  await prisma.reflection.create({
    data: {
      userId: user.id,
      type: "DAILY",
      answers: { highlight: "Stayed consistent even with low energy.", focus: "Short deep-work block." }
    }
  });

  await prisma.reflection.create({
    data: {
      userId: user.id,
      type: "WEEKLY",
      answers: {
        q1: "I kept my meditation streak alive.",
        q2: "I avoided a big reading session.",
        q3: "Ship the habits CRUD end-to-end."
      }
    }
  });

  // XP transactions across 12 weeks for stats charts
  const xpSamples = [110, 85, 95, 70, 120, 55, 100, 90, 75, 130, 60, 45];
  for (let weeksAgo = 0; weeksAgo < xpSamples.length; weeksAgo++) {
    const weekStart = startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
    await prisma.xPTransaction.create({
      data: {
        userId: user.id,
        amount: xpSamples[weeksAgo],
        reason: "habit_completion",
        multiplier: 1,
        createdAt: addDays(weekStart, 2),
      },
    });
  }

  // Mind tracker data — 8 weeks for meditation trend
  for (let weeksAgo = 0; weeksAgo < 8; weeksAgo++) {
    const weekStart = startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
    await prisma.meditationSession.create({
      data: {
        userId: user.id,
        duration: [10, 15, 20, 25, 12, 18, 22, 16][weeksAgo] ?? 15,
        type: weeksAgo % 2 === 0 ? "breath" : "body scan",
        notes: "Seed session",
        focusMultiplierEarned: 1,
        createdAt: addDays(weekStart, 3),
      },
    });
  }

  await prisma.readingSession.createMany({
    data: [
      { userId: user.id, bookTitle: "Atomic Habits", pagesRead: 25, rating: 5, notes: "Systems > goals", createdAt: subDays(new Date(), 2) },
      { userId: user.id, bookTitle: "Deep Work", pagesRead: 18, rating: 4, notes: "Rituals help", createdAt: subDays(new Date(), 5) }
    ]
  });

  // Notification settings for a couple habits
  await prisma.notificationSetting.createMany({
    data: [
      { userId: user.id, habitId: hMeditate.id, time: "08:00", isEnabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      { userId: user.id, habitId: hWorkout.id, time: "18:30", isEnabled: true, days: ["Mon", "Wed", "Fri"] }
    ]
  });

  console.log("Seeded demo user:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


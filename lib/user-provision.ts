import { prisma } from "@/lib/prisma";

const DEFAULT_PROFILE = {
  level: 1,
  totalXP: 0,
  currentXP: 0,
  xpToNextLevel: 500,
  title: "Novice",
  preferredLanguage: "en",
} as const;

export async function ensureUserResources(userId: string) {
  await Promise.all([
    prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...DEFAULT_PROFILE },
      update: {},
    }),
    prisma.healthBar.upsert({
      where: { userId },
      create: {
        userId,
        currentHealth: 5,
        maxHealth: 5,
        isWounded: false,
      },
      update: {},
    }),
  ]);

  const overallStreak = await prisma.streak.findFirst({
    where: { userId, habitId: null },
  });

  if (!overallStreak) {
    await prisma.streak.create({
      data: {
        userId,
        habitId: null,
        currentStreak: 0,
        longestStreak: 0,
        freezesAvailable: 2,
      },
    });
  }
}

export async function provisionUserForAuth(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await ensureUserResources(existing.id);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      email,
      profile: {
        create: {
          ...DEFAULT_PROFILE,
        },
      },
      healthBar: {
        create: {
          currentHealth: 5,
          maxHealth: 5,
        },
      },
      streaks: {
        create: {
          habitId: null,
          currentStreak: 0,
          longestStreak: 0,
          freezesAvailable: 2,
        },
      },
    },
  });

  await ensureUserResources(user.id);
  return user;
}

import { prisma } from "@/lib/prisma";

export async function provisionUserForAuth(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email,
      profile: {
        create: {
          level: 1,
          totalXP: 0,
          currentXP: 0,
          xpToNextLevel: 500,
          title: "Novice",
          preferredLanguage: "en",
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
}

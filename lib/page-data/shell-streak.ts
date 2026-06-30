import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Fast streak read for the app shell — no missed-day processing. */
export const getShellStreak = cache(async (userId: string) => {
  return prisma.streak.findFirst({
    where: { userId, habitId: null },
    select: {
      currentStreak: true,
      freezesAvailable: true,
      lastMissedCheckAt: true,
    },
  });
});

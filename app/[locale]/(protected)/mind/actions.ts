"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { awardXP } from "@/lib/xp";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { meditationSessionSchema, readingSessionSchema } from "@/lib/validators";

const MEDITATION_XP = 15;
const READING_XP = 10;

function revalidateMind() {
  revalidatePath("/en/mind");
  revalidatePath("/ar/mind");
  revalidatePath("/en/dashboard");
  revalidatePath("/ar/dashboard");
  revalidatePath("/en", "layout");
  revalidatePath("/ar", "layout");
}

export async function createMeditationSession(input: unknown) {
  const viewer = await requireViewer();
  const parsed = meditationSessionSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.meditationSession.create({
      data: {
        userId: viewer.userId,
        duration: parsed.duration,
        type: parsed.type ?? "breath",
        notes: parsed.notes,
        focusMultiplierEarned: parsed.deepFocus ? 1.5 : 1,
      },
    });

    const xpResult = await awardXP(tx, viewer.userId, MEDITATION_XP, "meditation", 1);
    const unlockedAchievements = await checkAndUnlockAchievements(viewer.userId, tx);
    return { session, ...xpResult, unlockedAchievements };
  });

  revalidateMind();
  return result;
}

export async function deleteMeditationSession(sessionId: string) {
  const viewer = await requireViewer();
  await prisma.meditationSession.deleteMany({
    where: { id: sessionId, userId: viewer.userId },
  });
  revalidateMind();
  return { success: true as const };
}

export async function createReadingSession(input: unknown) {
  const viewer = await requireViewer();
  const parsed = readingSessionSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.readingSession.create({
      data: {
        userId: viewer.userId,
        bookTitle: parsed.bookTitle,
        pagesRead: parsed.pagesRead,
        rating: parsed.rating,
        notes: parsed.notes,
        createdAt: parsed.date ?? new Date(),
      },
    });

    const xpResult = await awardXP(tx, viewer.userId, READING_XP, "reading", 1);
    const unlockedAchievements = await checkAndUnlockAchievements(viewer.userId, tx);
    return { session, ...xpResult, unlockedAchievements };
  });

  revalidateMind();
  return result;
}

export async function getBookTitles() {
  const viewer = await requireViewer();
  const sessions = await prisma.readingSession.findMany({
    where: { userId: viewer.userId },
    select: { bookTitle: true },
    distinct: ["bookTitle"],
    orderBy: { bookTitle: "asc" },
  });
  return sessions.map((s) => s.bookTitle);
}

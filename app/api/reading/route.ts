import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { readingSessionSchema } from "@/lib/validators";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const sessions = await prisma.readingSession.findMany({
    where: { userId: viewer.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const parsed = readingSessionSchema.parse(body);

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

      const xpResult = await awardXP(tx, viewer.userId, parsed.pagesRead, "reading", 1);
      const unlockedAchievements = await checkAndUnlockAchievements(viewer.userId, tx);
      return { session, ...xpResult, unlockedAchievements };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

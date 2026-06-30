import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { readingSessionSchema } from "@/lib/validators";

const READING_XP = 10;

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const sessions = await prisma.readingSession.findMany({
    where: { userId: viewer.userId },
    orderBy: { createdAt: "desc" },
  });

  const stats = await prisma.readingSession.aggregate({
    where: { userId: viewer.userId },
    _count: true,
    _sum: { pagesRead: true },
  });

  return NextResponse.json({
    sessions,
    stats: {
      count: stats._count,
      totalPages: stats._sum.pagesRead ?? 0,
    },
  });
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

      const xpResult = await awardXP(tx, viewer.userId, READING_XP, "reading", 1);
      return { session, ...xpResult };
    });

    void checkAndUnlockAchievements(viewer.userId).catch(() => undefined);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";
import { meditationSessionSchema } from "@/lib/validators";

const MEDITATION_XP = 15;

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const sessions = await prisma.meditationSession.findMany({
    where: { userId: viewer.userId },
    orderBy: { sessionDate: "desc" },
  });

  const stats = await prisma.meditationSession.aggregate({
    where: { userId: viewer.userId },
    _count: true,
    _sum: { duration: true },
  });

  return NextResponse.json({
    sessions,
    stats: {
      count: stats._count,
      totalMinutes: stats._sum.duration ?? 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const parsed = meditationSessionSchema.parse(body);
    const sessionDate = parsed.date ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.meditationSession.create({
        data: {
          userId: viewer.userId,
          duration: parsed.duration,
          type: parsed.type ?? "Breath",
          notes: parsed.notes,
          sessionDate,
          focusMultiplierEarned: 1,
        },
      });

      const xpResult = await awardXP(tx, viewer.userId, MEDITATION_XP, "meditation", 1);
      return { session, ...xpResult };
    });

    void checkAndUnlockAchievements(viewer.userId).catch(() => undefined);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

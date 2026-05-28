import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/xp";
import { meditationSessionSchema } from "@/lib/validators";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const sessions = await prisma.meditationSession.findMany({
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
    const parsed = meditationSessionSchema.parse(body);
    const multiplier = parsed.deepFocus ? 1.5 : 1;
    const xpAmount = Math.round(parsed.duration * multiplier);

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.meditationSession.create({
        data: {
          userId: viewer.userId,
          duration: parsed.duration,
          type: parsed.type ?? "breath",
          notes: parsed.notes,
          focusMultiplierEarned: multiplier,
        },
      });

      const xpResult = await awardXP(tx, viewer.userId, xpAmount, "meditation", 1);
      return { session, ...xpResult };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

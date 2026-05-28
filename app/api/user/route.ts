import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { getUserSnapshot, updateUserProfile } from "@/lib/services/habits";
import { getLevelProgress, getTitleFromLevel } from "@/lib/level-utils";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const snapshot = await getUserSnapshot(viewer.userId);
  return NextResponse.json(snapshot);
}

export async function PUT(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const profile = await updateUserProfile(viewer.userId, {
      preferredLanguage: body.preferredLanguage,
      title: body.title,
    });

    if (typeof body.totalXP === "number") {
      const progress = getLevelProgress(body.totalXP);
      const updated = await updateUserProfile(viewer.userId, {
        totalXP: progress.totalXP,
        currentXP: progress.currentXP,
        xpToNextLevel: progress.xpToNextLevel,
        level: progress.level,
        title: getTitleFromLevel(progress.level),
      });
      return NextResponse.json({ profile: updated });
    }

    if (typeof body.healthPoints === "number") {
      const { prisma } = await import("@/lib/prisma");
      const healthBar = await prisma.healthBar.update({
        where: { userId: viewer.userId },
        data: { currentHealth: body.healthPoints },
      });
      return NextResponse.json({ profile, healthBar });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

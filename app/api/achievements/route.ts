import { NextResponse } from "next/server";
import { requireApiViewer, isNextResponse } from "@/lib/api-auth";
import { getAchievementsForUser } from "@/lib/achievements";
import { checkAndUnlockAchievements } from "@/lib/achievement-engine";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  await checkAndUnlockAchievements(viewer.userId);
  const achievements = await getAchievementsForUser(viewer.userId);
  return NextResponse.json({ achievements });
}

import { NextResponse } from "next/server";
import { requireApiViewer, isNextResponse } from "@/lib/api-auth";
import { refreshWeeklyBoss } from "@/lib/weekly-boss";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const boss = await refreshWeeklyBoss(viewer.userId);

  return NextResponse.json({
    boss: {
      title: boss.title,
      description: boss.description,
      currentValue: boss.currentValue,
      targetValue: boss.targetValue,
      xpReward: boss.xpReward,
      isCompleted: boss.isCompleted,
    },
  });
}

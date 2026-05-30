import { NextResponse } from "next/server";
import { requireApiViewer, isNextResponse } from "@/lib/api-auth";
import { getWeeklyBossForDisplay, toBossPayload } from "@/lib/weekly-boss";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const boss = await getWeeklyBossForDisplay(viewer.userId);

  return NextResponse.json({ boss: toBossPayload(boss) });
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { completeHabitForUser } from "@/lib/services/habits";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await completeHabitForUser(viewer.userId, { ...body, habitId: id });
    return NextResponse.json(result);
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

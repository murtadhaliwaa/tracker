import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { createHabitForUser, listHabits } from "@/lib/services/habits";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const habits = await listHabits(viewer.userId);
  return NextResponse.json({ habits });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const habit = await createHabitForUser(viewer.userId, body);
    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

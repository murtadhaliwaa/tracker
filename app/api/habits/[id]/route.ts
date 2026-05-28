import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse, notFoundResponse } from "@/lib/api-auth";
import { deleteHabitForUser, updateHabitForUser } from "@/lib/services/habits";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const body = await request.json();
    await updateHabitForUser(viewer.userId, { ...body, id });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    if (message === "Habit not found") return notFoundResponse(message);
    return badRequestResponse(message);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    await deleteHabitForUser(viewer.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    if (message === "Habit not found") return notFoundResponse(message);
    return badRequestResponse(message);
  }
}

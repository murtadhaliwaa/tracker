import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse, notFoundResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateRewardSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateRewardSchema.parse({ ...body, id });

    const result = await prisma.rewardVault.updateMany({
      where: { id: parsed.id, userId: viewer.userId },
      data: {
        title: parsed.title,
        description: parsed.description,
        xpCost: parsed.xpCost,
        emoji: parsed.emoji,
        isUnlocked: body.isUnlocked ?? undefined,
      },
    });

    if (result.count === 0) return notFoundResponse("Reward not found");
    return NextResponse.json({ success: true });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;
  const result = await prisma.rewardVault.deleteMany({ where: { id, userId: viewer.userId } });
  if (result.count === 0) return notFoundResponse("Reward not found");
  return NextResponse.json({ success: true });
}

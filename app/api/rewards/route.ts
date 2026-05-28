import { NextRequest, NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { rewardFormSchema } from "@/lib/validators";

export async function GET() {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const rewards = await prisma.rewardVault.findMany({
    where: { userId: viewer.userId },
    orderBy: { xpCost: "asc" },
  });

  return NextResponse.json({ rewards });
}

export async function POST(request: NextRequest) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  try {
    const body = await request.json();
    const parsed = rewardFormSchema.parse(body);

    const reward = await prisma.rewardVault.create({
      data: {
        userId: viewer.userId,
        title: parsed.title,
        description: parsed.description,
        xpCost: parsed.xpCost,
        emoji: parsed.emoji,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

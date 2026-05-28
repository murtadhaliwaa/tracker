import { NextResponse } from "next/server";
import { requireApiViewer, isNextResponse, notFoundResponse, badRequestResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { deductXP } from "@/lib/xp";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const viewer = await requireApiViewer();
  if (isNextResponse(viewer)) return viewer;

  const { id } = await context.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reward = await tx.rewardVault.findFirst({
        where: { id, userId: viewer.userId },
      });
      if (!reward) throw new Error("NOT_FOUND");
      if (reward.claimedAt) throw new Error("Already redeemed");

      const deductResult = await deductXP(tx, viewer.userId, reward.xpCost, "reward_redeem");
      if (!deductResult.success) {
        return { ...deductResult, insufficientXp: true };
      }

      const updated = await tx.rewardVault.update({
        where: { id: reward.id },
        data: { claimedAt: new Date(), isUnlocked: true },
      });

      return {
        ...deductResult,
        insufficientXp: false,
        reward: updated,
        xpCost: reward.xpCost,
      };
    });

    if (!result.success && result.insufficientXp) {
      return NextResponse.json({ error: "Not enough XP", insufficientXp: true }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return notFoundResponse("Reward not found");
    }
    return badRequestResponse(error instanceof Error ? error.message : "Invalid request");
  }
}

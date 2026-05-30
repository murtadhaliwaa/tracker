import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getShellProfile = cache(async (userId: string) => {
  return prisma.userProfile.findUnique({ where: { userId } });
});

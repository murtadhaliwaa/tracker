"use server";

import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { isValidAvatarStyle, serializeAvatarStyle } from "@/lib/player-profile";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatarStyle: z.string().min(1),
  avatarColor: z.string().min(1).optional(),
  avatarIcon: z.string().min(1).optional(),
});

function revalidateProfilePaths() {
  revalidateLocalePaths("/profile", "/dashboard");
}

export async function updateProfile(input: unknown) {
  const viewer = await requireViewer();
  const parsed = profileSchema.parse(input);

  const avatarStyle =
    parsed.avatarColor && parsed.avatarIcon
      ? serializeAvatarStyle(parsed.avatarColor, parsed.avatarIcon)
      : parsed.avatarStyle;

  if (!isValidAvatarStyle(avatarStyle)) throw new Error("Invalid avatar style");

  await prisma.userProfile.upsert({
    where: { userId: viewer.userId },
    create: {
      userId: viewer.userId,
      name: parsed.name,
      avatarStyle,
      level: 1,
      totalXP: 0,
      currentXP: 0,
      xpToNextLevel: 500,
      title: "Novice",
      preferredLanguage: "en",
    },
    update: {
      name: parsed.name,
      avatarStyle,
    },
  });

  revalidateProfilePaths();
  return { success: true as const };
}

export async function updateProfileName(name: string) {
  const viewer = await requireViewer();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  await prisma.userProfile.upsert({
    where: { userId: viewer.userId },
    create: {
      userId: viewer.userId,
      name: trimmed,
      level: 1,
      totalXP: 0,
      currentXP: 0,
      xpToNextLevel: 500,
      title: "Novice",
      preferredLanguage: "en",
    },
    update: { name: trimmed },
  });

  revalidateProfilePaths();
  return { success: true as const };
}

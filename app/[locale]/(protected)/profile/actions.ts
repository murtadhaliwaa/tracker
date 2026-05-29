"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath("/en/profile");
  revalidatePath("/ar/profile");
  revalidatePath("/en/dashboard");
  revalidatePath("/ar/dashboard");
}

export async function updateProfile(input: unknown) {
  const viewer = await requireViewer();
  const parsed = profileSchema.parse(input);

  const avatarStyle =
    parsed.avatarColor && parsed.avatarIcon
      ? serializeAvatarStyle(parsed.avatarColor, parsed.avatarIcon)
      : parsed.avatarStyle;

  if (!isValidAvatarStyle(avatarStyle)) throw new Error("Invalid avatar style");

  await prisma.userProfile.update({
    where: { userId: viewer.userId },
    data: {
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

  await prisma.userProfile.update({
    where: { userId: viewer.userId },
    data: { name: trimmed },
  });

  revalidateProfilePaths();
  return { success: true as const };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { AVATAR_COLOR_OPTIONS } from "@/lib/player-profile";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatarStyle: z.string().min(1),
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

  const validStyle = AVATAR_COLOR_OPTIONS.some(
    (c) => c.id === parsed.avatarStyle || c.value === parsed.avatarStyle,
  );
  if (!validStyle) throw new Error("Invalid avatar color");

  await prisma.userProfile.update({
    where: { userId: viewer.userId },
    data: {
      name: parsed.name,
      avatarStyle: parsed.avatarStyle,
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

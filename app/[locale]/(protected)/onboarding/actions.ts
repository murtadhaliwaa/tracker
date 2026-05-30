"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { createHabitForUser } from "@/lib/services/habits";
import { ONBOARDING_HABIT_PRESETS } from "@/lib/onboarding-presets";

const nameSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

function revalidateAll() {
  revalidatePath("/en/dashboard");
  revalidatePath("/ar/dashboard");
  revalidatePath("/en/habits");
  revalidatePath("/ar/habits");
  revalidatePath("/en/profile");
  revalidatePath("/ar/profile");
}

export async function saveOnboardingName(input: unknown) {
  const viewer = await requireViewer();
  const parsed = nameSchema.parse(input);

  await prisma.userProfile.upsert({
    where: { userId: viewer.userId },
    create: {
      userId: viewer.userId,
      name: parsed.name,
      level: 1,
      totalXP: 0,
      currentXP: 0,
      xpToNextLevel: 500,
      title: "Novice",
      preferredLanguage: "en",
    },
    update: { name: parsed.name },
  });

  revalidateAll();
  return { success: true as const };
}

export async function addOnboardingHabits(
  selected: { key: string; title: string }[],
) {
  const viewer = await requireViewer();
  const presets = ONBOARDING_HABIT_PRESETS.filter((p) =>
    selected.some((item) => item.key === p.key),
  );

  if (presets.length < 1 || presets.length > 3) {
    throw new Error("Select between 1 and 3 habits");
  }

  for (const preset of presets) {
    const localizedTitle =
      selected.find((item) => item.key === preset.key)?.title ?? preset.title;

    await createHabitForUser(viewer.userId, {
      title: localizedTitle,
      period: "DAILY",
      frequency: { type: "daily" },
      logType: "CHECKBOX",
      categoryName: "Discipline",
      xpValue: 10,
      icon: preset.icon,
      color: preset.color,
    });
  }

  revalidateAll();
  return { success: true as const, count: presets.length };
}

export async function completeOnboarding() {
  const viewer = await requireViewer();

  await prisma.userProfile.upsert({
    where: { userId: viewer.userId },
    create: {
      userId: viewer.userId,
      level: 1,
      totalXP: 0,
      currentXP: 0,
      xpToNextLevel: 500,
      title: "Novice",
      preferredLanguage: "en",
      onboardingComplete: true,
    },
    update: { onboardingComplete: true },
  });

  revalidateAll();
  return { success: true as const };
}

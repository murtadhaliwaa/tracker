"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LevelUpModal = dynamic(
  () => import("@/components/shared/level-up-modal").then((m) => m.LevelUpModal),
  { ssr: false },
);

type Props = ComponentProps<typeof LevelUpModal>;

/** Loads BorderGlow + ShinyText only when a level-up actually occurs. */
export function LazyLevelUpModal({ open, ...rest }: Props) {
  if (!open) return null;
  return <LevelUpModal open={open} {...rest} />;
}

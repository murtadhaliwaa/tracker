"use client";

import { useEffect } from "react";
import { dispatchShellStats } from "@/lib/shell-stats-client";

type Props = {
  streak: number;
  freezesAvailable: number;
};

/** Syncs streak/freeze counts to the app shell after session streak processing. */
export function ShellStreakSync({ streak, freezesAvailable }: Props) {
  useEffect(() => {
    dispatchShellStats({ streakDays: streak, freezesAvailable });
  }, [streak, freezesAvailable]);

  return null;
}

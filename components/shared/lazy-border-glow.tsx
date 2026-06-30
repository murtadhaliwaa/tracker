"use client";

import dynamic from "next/dynamic";
import type { ComponentProps, ReactNode } from "react";

const BorderGlow = dynamic(() => import("@/components/BorderGlow"), { ssr: false });

type Props = ComponentProps<typeof BorderGlow> & { children: ReactNode };

export function LazyBorderGlow({ children, ...props }: Props) {
  return (
    <BorderGlow {...props}>
      {children}
    </BorderGlow>
  );
}

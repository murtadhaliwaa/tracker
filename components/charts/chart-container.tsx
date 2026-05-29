"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartSize = { width: number; height: number };

type Props = {
  height: number;
  className?: string;
  children: (size: ChartSize) => ReactNode;
};

/** Measures parent width and passes explicit pixel dimensions to Recharts (avoids ResponsiveContainer mobile bugs). */
export function ChartContainer({ height, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const next = Math.floor(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("w-full min-w-0 max-w-full", className)}
      style={{ height, minHeight: height }}
    >
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}

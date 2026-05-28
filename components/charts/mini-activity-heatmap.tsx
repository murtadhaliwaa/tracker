"use client";

import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { useMemo } from "react";

export type HeatmapDay = {
  date: string;
  count: number;
};

type Props = {
  days: HeatmapDay[];
  weeks?: number;
};

function colorForCount(count: number): string {
  if (count <= 0) return "#1e1e3a";
  if (count === 1) return "#3d2e6b";
  if (count === 2) return "#5c4499";
  if (count === 3) return "#7c5cbf";
  return "#9b7de0";
}

export function MiniActivityHeatmap({ days, weeks = 12 }: Props) {
  const countMap = useMemo(() => new Map(days.map((d) => [d.date, d.count])), [days]);

  const grid = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, weeks * 7 - 1);
    const allDays = eachDayOfInterval({ start, end });
    const rows: { date: Date; count: number }[][] = [[], [], [], [], [], [], []];

    for (const date of allDays) {
      const key = format(date, "yyyy-MM-dd");
      const row = (date.getDay() + 6) % 7;
      rows[row]!.push({ date, count: countMap.get(key) ?? 0 });
    }
    return rows;
  }, [countMap, weeks]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-[3px]">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-[3px]">
            {row.map((cell) => (
              <div
                key={cell.date.toISOString()}
                title={`${format(cell.date, "MMM d")} — ${cell.count} habits`}
                className="size-3 rounded-sm"
                style={{ backgroundColor: colorForCount(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

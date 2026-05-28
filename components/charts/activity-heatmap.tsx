"use client";

import { format, subDays, eachDayOfInterval, getDay, addWeeks, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export type HeatmapDay = {
  date: string;
  count: number;
};

type Props = {
  days: HeatmapDay[];
};

const CELL = 12;
const GAP = 3;
const WEEK_WIDTH = CELL + GAP;

function colorForCount(count: number): string {
  if (count <= 0) return "#1e1e3a";
  if (count === 1) return "#3d2e6b";
  if (count === 2) return "#5c4499";
  if (count === 3) return "#7c5cbf";
  return "#9b7de0";
}

export function ActivityHeatmap({ days }: Props) {
  const t = useTranslations("stats");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const dayLabels = [
    t("heatmapMon"),
    t("heatmapTue"),
    t("heatmapWed"),
    t("heatmapThu"),
    t("heatmapFri"),
    t("heatmapSat"),
    t("heatmapSun"),
  ];

  const countMap = useMemo(() => new Map(days.map((d) => [d.date, d.count])), [days]);

  const grid = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 364);
    const allDays = eachDayOfInterval({ start, end });
    const weeks: { date: Date; count: number }[][] = [];

    let currentWeek: { date: Date; count: number }[] = [];
    const firstDay = allDays[0];
    const pad = (getDay(firstDay) + 6) % 7;
    for (let i = 0; i < pad; i++) {
      currentWeek.push({ date: subDays(firstDay, pad - i), count: -1 });
    }

    for (const date of allDays) {
      const key = format(date, "yyyy-MM-dd");
      currentWeek.push({ date, count: countMap.get(key) ?? 0 });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: addWeeks(end, 1), count: -1 });
      }
      weeks.push(currentWeek);
    }

    return weeks.slice(-53);
  }, [countMap]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = "";
    grid.forEach((week, col) => {
      const valid = week.find((d) => d.count >= 0);
      if (!valid) return;
      const month = format(valid.date, "MMM");
      if (month !== lastMonth) {
        labels.push({ label: month, col });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const labelColumnWidth = 32;

  return (
    <>
      <div className="w-full max-w-full overflow-x-auto pb-2">
        <div className="min-w-max">
          <div className="mb-2 flex" style={{ paddingInlineStart: `${labelColumnWidth}px` }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.col}`}
                className="shrink-0 text-[10px] text-[#8888aa]"
                style={{ marginInlineStart: m.col === 0 ? 0 : `${m.col * WEEK_WIDTH - 8}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <div
              className="flex shrink-0 flex-col gap-[3px] pt-[2px]"
              style={{ width: labelColumnWidth }}
            >
              {dayLabels.map((label) => (
                <span
                  key={label}
                  className="flex items-center text-[10px] leading-none text-[#8888aa]"
                  style={{ height: CELL }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 gap-[3px]">
              {grid.map((week, wi) => (
                <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
                  {week.map((cell, di) => {
                    if (cell.count < 0) {
                      return (
                        <div
                          key={di}
                          className="shrink-0 rounded-[2px] bg-transparent"
                          style={{ width: CELL, height: CELL }}
                        />
                      );
                    }
                    const key = format(cell.date, "yyyy-MM-dd");
                    const isToday = key === todayKey;
                    return (
                      <button
                        key={di}
                        type="button"
                        className="shrink-0 rounded-[2px] transition hover:brightness-125"
                        style={{
                          width: CELL,
                          height: CELL,
                          background: colorForCount(cell.count),
                          outline: isToday ? "2px solid #f0c040" : undefined,
                          outlineOffset: "1px",
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            text: t("heatmapTooltip", {
                              date: format(cell.date, "PP"),
                              count: cell.count,
                            }),
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        aria-label={t("heatmapTooltip", {
                          date: format(cell.date, "PP"),
                          count: cell.count,
                        })}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-[#8888aa]">
        <span>{t("heatmapLess")}</span>
        {[0, 1, 2, 3, 4].map((c) => (
          <span key={c} className="size-3 rounded-[2px]" style={{ background: colorForCount(c === 0 ? 0 : c) }} />
        ))}
        <span>{t("heatmapMore")}</span>
      </div>
      {tooltip ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-[#13131f] px-2 py-1 text-xs text-[#e8e8f0] shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          {tooltip.text}
        </div>
      ) : null}
    </>
  );
}

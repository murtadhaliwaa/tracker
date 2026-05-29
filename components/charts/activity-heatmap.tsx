"use client";

import {
  addWeeks,
  eachDayOfInterval,
  format,
  getDay,
  startOfDay,
  subDays,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type HeatmapDay = {
  date: string;
  count: number;
};

type Props = {
  days: HeatmapDay[];
  /** When set, overrides responsive week count. */
  weeks?: number;
};

const GAP = 3;
const LABEL_WIDTH = 28;

function colorForCount(count: number): string {
  if (count <= 0) return "#1e1e3a";
  if (count === 1) return "#3d2e6b";
  if (count === 2) return "#5c4499";
  if (count === 3) return "#7c5cbf";
  return "#9b7de0";
}

function useResponsiveWeekCount(explicit?: number) {
  const [weekCount, setWeekCount] = useState(explicit ?? 12);

  useEffect(() => {
    if (explicit != null) {
      setWeekCount(explicit);
      return;
    }

    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (lg.matches) setWeekCount(26);
      else if (md.matches) setWeekCount(16);
      else setWeekCount(12);
    };

    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, [explicit]);

  return weekCount;
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      setWidth(node.getBoundingClientRect().width);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function buildWeekGrid(countMap: Map<string, number>, weekCount: number) {
  const end = startOfDay(new Date());
  const start = subDays(end, weekCount * 7 - 1);
  const allDays = eachDayOfInterval({ start, end });
  const weeks: { date: Date; count: number }[][] = [];

  let currentWeek: { date: Date; count: number }[] = [];
  const firstDay = allDays[0]!;
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

  return weeks;
}

export function ActivityHeatmap({ days, weeks: weeksProp }: Props) {
  const t = useTranslations("stats");
  const weekCount = useResponsiveWeekCount(weeksProp);
  const { ref: containerRef, width: containerWidth } = useContainerWidth();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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
  const grid = useMemo(() => buildWeekGrid(countMap, weekCount), [countMap, weekCount]);

  const columns = grid.length;
  const availableWidth = Math.max(containerWidth - LABEL_WIDTH, 0);
  const fitCellSize =
    columns > 0
      ? Math.floor((availableWidth - (columns - 1) * GAP) / columns)
      : 12;

  // Scale cells to fill the card width — avoids broken layout inside overflow-x-hidden shells.
  const cellSize = Math.max(8, Math.min(20, fitCellSize || 12));

  const monthByColumn = useMemo(() => {
    let lastMonth = "";
    return grid.map((week) => {
      const valid = week.find((d) => d.count >= 0);
      if (!valid) return { label: "", show: false };
      const month = format(valid.date, "MMM");
      if (month === lastMonth) return { label: month, show: false };
      lastMonth = month;
      return { label: month, show: true };
    });
  }, [grid]);

  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div className="overflow-hidden pb-1">
        <div>
          {/* Month row — one column per week */}
          <div className="mb-1 flex" style={{ gap: GAP, paddingInlineStart: LABEL_WIDTH }}>
            {monthByColumn.map((month, wi) => (
              <div
                key={wi}
                className="shrink-0 overflow-hidden text-[10px] leading-none text-[#8888aa]"
                style={{ width: cellSize, height: 14 }}
              >
                {month.show ? month.label : null}
              </div>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {/* Day labels — Mon / Wed / Fri only (GitHub-style) */}
            <div
              className="flex shrink-0 flex-col"
              style={{ width: LABEL_WIDTH, gap: GAP, paddingTop: 1 }}
            >
              {dayLabels.map((label, rowIdx) => (
                <span
                  key={label}
                  className="flex items-center text-[10px] leading-none text-[#8888aa]"
                  style={{ height: cellSize }}
                >
                  {rowIdx === 0 || rowIdx === 2 || rowIdx === 4 ? label : ""}
                </span>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex shrink-0" style={{ gap: GAP }}>
              {grid.map((week, wi) => (
                <div key={wi} className="flex shrink-0 flex-col" style={{ gap: GAP }}>
                  {week.map((cell, di) => {
                    if (cell.count < 0) {
                      return (
                        <div
                          key={di}
                          className="shrink-0 rounded-[3px] bg-transparent"
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    }

                    const key = format(cell.date, "yyyy-MM-dd");
                    const isToday = key === todayKey;
                    const isActive = activeTooltip === key;
                    const tooltipText = t("heatmapTooltip", {
                      date: format(cell.date, "PP"),
                      count: cell.count,
                    });

                    return (
                      <button
                        key={di}
                        type="button"
                        className="shrink-0 rounded-[3px] transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rpg-gold"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          background: colorForCount(cell.count),
                          outline: isToday ? "2px solid #f0c040" : isActive ? "2px solid #e8e8f0" : undefined,
                          outlineOffset: "1px",
                        }}
                        onClick={() => setActiveTooltip((prev) => (prev === key ? null : key))}
                        aria-label={tooltipText}
                        aria-pressed={isActive}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTooltip ? (
        <p className="mt-2 text-center text-xs text-rpg-secondary">
          {(() => {
            const cell = grid.flat().find((d) => d.count >= 0 && format(d.date, "yyyy-MM-dd") === activeTooltip);
            if (!cell) return null;
            return t("heatmapTooltip", {
              date: format(cell.date, "PP"),
              count: cell.count,
            });
          })()}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#8888aa] sm:justify-start">
        <span>{t("heatmapLess")}</span>
        {[0, 1, 2, 3, 4].map((c) => (
          <span
            key={c}
            className="rounded-[3px]"
            style={{
              width: Math.max(cellSize, 12),
              height: Math.max(cellSize, 12),
              background: colorForCount(c === 0 ? 0 : c),
            }}
          />
        ))}
        <span>{t("heatmapMore")}</span>
      </div>
    </div>
  );
}

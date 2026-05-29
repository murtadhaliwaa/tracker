"use client";

import {
  addDays,
  addWeeks,
  format,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export type HeatmapDay = {
  date: string;
  count: number;
};

type HeatmapCell = {
  date: Date;
  count: number;
};

type Props = {
  days: HeatmapDay[];
  /** When set, overrides responsive week count. */
  weeks?: number;
};

const GAP = 4;
const LABEL_WIDTH = 30;
const MONTH_ROW_HEIGHT = 18;

function colorForCount(count: number): { bg: string; glow?: string } {
  if (count <= 0) return { bg: "#161625" };
  if (count === 1) return { bg: "#3d2e6b" };
  if (count === 2) return { bg: "#5c4499" };
  if (count === 3) return { bg: "#7c5cbf" };
  return { bg: "#a78bfa", glow: "0 0 8px rgba(167,139,250,0.55)" };
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

/** Full Sun–Sat week columns (GitHub-style) so every row aligns. */
function buildWeekGrid(countMap: Map<string, number>, weekCount: number): HeatmapCell[][] {
  const today = startOfDay(new Date());
  const currentWeekSunday = startOfWeek(today, { weekStartsOn: 0 });
  const firstWeekSunday = subWeeks(currentWeekSunday, weekCount - 1);

  const weeks: HeatmapCell[][] = [];
  for (let w = 0; w < weekCount; w++) {
    const weekSunday = addWeeks(firstWeekSunday, w);
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekSunday, d);
      const isFuture = date > today;
      const key = format(date, "yyyy-MM-dd");
      week.push({
        date,
        count: isFuture ? -1 : (countMap.get(key) ?? 0),
      });
    }
    weeks.push(week);
  }

  return weeks;
}

function buildMonthMarkers(weeks: HeatmapCell[][]) {
  const seenMonths = new Set<string>();

  return weeks.map((week, columnIndex) => {
    const inRangeDays = week.filter((cell) => cell.count >= 0);
    const firstOfMonth = inRangeDays.find((cell) => cell.date.getDate() === 1);

    if (firstOfMonth) {
      const monthKey = format(firstOfMonth.date, "yyyy-MM");
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        return {
          label: format(firstOfMonth.date, "MMM"),
          show: true,
        };
      }
    }

    if (columnIndex === 0 && inRangeDays[0]) {
      const monthKey = format(inRangeDays[0].date, "yyyy-MM");
      seenMonths.add(monthKey);
      return {
        label: format(inRangeDays[0].date, "MMM"),
        show: true,
      };
    }

    return { label: "", show: false };
  });
}

function formatHeatmapDate(date: Date, locale: string) {
  const dfLocale = locale === "ar" ? ar : enUS;
  return format(date, "EEEE, MMMM d, yyyy", { locale: dfLocale });
}

export function ActivityHeatmap({ days, weeks: weeksProp }: Props) {
  const t = useTranslations("stats");
  const locale = useLocale();
  const weekCount = useResponsiveWeekCount(weeksProp);
  const { ref: containerRef, width: containerWidth } = useContainerWidth();
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [activeKey, setActiveKey] = useState<string | null>(todayKey);

  const dayLabels = [
    t("heatmapSun"),
    t("heatmapMon"),
    t("heatmapTue"),
    t("heatmapWed"),
    t("heatmapThu"),
    t("heatmapFri"),
    t("heatmapSat"),
  ];

  const countMap = useMemo(() => new Map(days.map((d) => [d.date, d.count])), [days]);
  const grid = useMemo(() => buildWeekGrid(countMap, weekCount), [countMap, weekCount]);
  const monthMarkers = useMemo(() => buildMonthMarkers(grid), [grid]);

  const columns = grid.length;
  const availableWidth = Math.max(containerWidth - LABEL_WIDTH, 0);
  const fitCellSize =
    columns > 0
      ? Math.floor((availableWidth - (columns - 1) * GAP) / columns)
      : 12;

  const cellSize = Math.max(9, Math.min(22, fitCellSize || 12));
  const gridTemplateColumns = `${LABEL_WIDTH}px repeat(${columns}, ${cellSize}px)`;

  const activeCell = useMemo(() => {
    if (!activeKey) return null;
    return grid.flat().find((d) => d.count >= 0 && format(d.date, "yyyy-MM-dd") === activeKey) ?? null;
  }, [activeKey, grid]);

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div className="overflow-hidden pb-1">
        <div
          style={{
            display: "grid",
            gridTemplateColumns,
            columnGap: GAP,
            rowGap: GAP,
          }}
        >
          {/* Month row with tick marks */}
          <div style={{ height: MONTH_ROW_HEIGHT }} />
          {monthMarkers.map((month, wi) => (
            <div
              key={`month-${wi}`}
              className="flex flex-col items-start justify-end"
              style={{ height: MONTH_ROW_HEIGHT }}
            >
              {month.show ? (
                <>
                  <span className="mb-0.5 ms-0.5 block h-1.5 w-px bg-[#8888aa]/70" aria-hidden />
                  <span className="text-[10px] leading-none text-[#8888aa]">{month.label}</span>
                </>
              ) : null}
            </div>
          ))}

          {/* Sun → Sat rows */}
          {[0, 1, 2, 3, 4, 5, 6].map((rowIdx) => (
            <Fragment key={`row-${rowIdx}`}>
              <span
                className="flex items-center text-[10px] leading-none text-[#8888aa]"
                style={{ height: cellSize }}
              >
                {dayLabels[rowIdx]}
              </span>

              {grid.map((week, wi) => {
                const cell = week[rowIdx]!;

                if (cell.count < 0) {
                  return (
                    <div
                      key={`${wi}-${rowIdx}`}
                      className="rounded-[4px] bg-[#12121f]"
                      style={{ width: cellSize, height: cellSize }}
                    />
                  );
                }

                const key = format(cell.date, "yyyy-MM-dd");
                const isSelected = activeKey === key;
                const { bg, glow } = colorForCount(cell.count);
                const tooltipText = t("heatmapTooltip", {
                  date: formatHeatmapDate(cell.date, locale),
                  count: cell.count,
                });

                return (
                  <button
                    key={`${wi}-${rowIdx}`}
                    type="button"
                    className="rounded-[4px] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rpg-gold"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: bg,
                      boxShadow: isSelected
                        ? "0 0 0 2px #f0c040"
                        : glow,
                      outline: "none",
                    }}
                    onClick={() => setActiveKey((prev) => (prev === key ? null : key))}
                    aria-label={tooltipText}
                    aria-pressed={isSelected}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {activeCell ? (
        <p className="mt-3 text-center text-xs text-[#8888aa]">
          {t("heatmapTooltip", {
            date: formatHeatmapDate(activeCell.date, locale),
            count: activeCell.count,
          })}
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-[#8888aa]/60">{t("heatmapHint")}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#8888aa]">
        <span>{t("heatmapLess")}</span>
        {[0, 1, 2, 3, 4].map((c) => {
          const { bg, glow } = colorForCount(c === 0 ? 0 : c);
          return (
            <span
              key={c}
              className="rounded-[4px]"
              style={{
                width: 12,
                height: 12,
                background: bg,
                boxShadow: glow,
              }}
            />
          );
        })}
        <span>{t("heatmapMore")}</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { format, startOfWeek, subWeeks } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Area,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { ActivityHeatmap, type HeatmapDay } from "@/components/charts/activity-heatmap";
import { ChartContainer } from "@/components/charts/chart-container";
import { GhostLeagueChart } from "@/components/charts/ghost-league-chart";

type GhostLeague = {
  thisWeekXp: number;
  lastMonthXp: number;
  status: "ahead" | "behind" | "tied";
  chartData: { name: string; xp: number }[];
};

type Props = {
  weeklyXp: { name: string; xp: number }[];
  radar: { subject: string; value: number }[];
  meditationTrend: { week: string; minutes: number }[];
  heatmapDays: HeatmapDay[];
  ghostLeague: GhostLeague;
};

type MeditationSession = {
  sessionDate: string;
  duration: number;
};

function buildMeditationTrend(sessions: MeditationSession[]) {
  return Array.from({ length: 4 }).map((_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 3 - i), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(subWeeks(new Date(), 2 - i), { weekStartsOn: 1 });
    const minutes = sessions
      .filter((m) => {
        const d = new Date(m.sessionDate);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((a, m) => a + m.duration, 0);
    return { week: format(weekStart, "MMM d"), minutes };
  });
}

const CHART_GOLD = "#D4AF37";
const CHART_PURPLE = "#7C3AED";
const CHART_GRID = "#2a2a4e";
const CHART_TICK = "#666688";

const barChartMargin = { top: 10, right: 16, left: 0, bottom: 5 };

export function StatsClient({ weeklyXp, radar, meditationTrend: initialTrend, heatmapDays, ghostLeague }: Props) {
  const t = useTranslations("stats");
  const [meditationTrend, setMeditationTrend] = useState(initialTrend);

  useEffect(() => {
    fetch("/api/mind/meditation")
      .then((r) => r.json())
      .then((data: { sessions: MeditationSession[] }) => {
        if (data.sessions?.length) {
          setMeditationTrend(buildMeditationTrend(data.sessions));
        }
      })
      .catch(() => {
        /* keep server-provided trend as fallback */
      });
  }, []);

  const weeklyMaxXp = Math.max(...weeklyXp.map((item) => item.xp), 1);
  const meditationMax = Math.max(...meditationTrend.map((item) => item.minutes), 1);

  const badgeClass =
    ghostLeague.status === "ahead"
      ? "border-rpg-border bg-rpg-success/10 text-rpg-success"
      : ghostLeague.status === "behind"
        ? "border-rpg-border bg-rpg-muted/10 text-rpg-muted"
        : "border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.15)] text-rpg-gold";

  return (
    <div className="min-w-0 max-w-full space-y-10 overflow-x-hidden">
      <RPGPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <RPGCard className="min-w-0">
          <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("weeklyXp")}</h2>
          <ChartContainer height={180}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={weeklyXp}
                margin={barChartMargin}
                barCategoryGap="20%"
                barGap={4}
              >
                <CartesianGrid stroke={CHART_GRID} strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  scale="band"
                  tick={{ fill: CHART_TICK, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  tick={{ fill: CHART_TICK, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  domain={[0, weeklyMaxXp]}
                  allowDecimals={false}
                />
                <Tooltip />
                <Bar
                  dataKey="xp"
                  fill={CHART_PURPLE}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                  minPointSize={4}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ChartContainer>
        </RPGCard>

        <RPGCard className="min-w-0">
          <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("lifeBalance")}</h2>
          <ChartContainer height={200} className="mx-auto max-w-[300px]">
            {({ width, height }) => (
              <RadarChart
                width={width}
                height={height}
                data={radar}
                outerRadius={Math.min(width, height) * 0.32}
              >
                <PolarGrid stroke={CHART_GRID} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_TICK, fontSize: 10 }} />
                <Radar
                  name="Life Balance"
                  dataKey="value"
                  stroke={CHART_PURPLE}
                  strokeWidth={2}
                  fill={CHART_PURPLE}
                  fillOpacity={0.4}
                  isAnimationActive={false}
                />
                <Tooltip />
              </RadarChart>
            )}
          </ChartContainer>
        </RPGCard>
      </div>

      <RPGCard className="min-w-0 w-full">
        <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("ghostLeague")}</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="rpg-stat-label text-rpg-muted">{t("thisWeek")}</p>
            <p className="rpg-stat-value text-rpg-gold">{ghostLeague.thisWeekXp}</p>
          </div>
          <span className={`rounded-full border px-4 py-1 text-sm font-bold ${badgeClass}`}>
            {t(`ghostStatus.${ghostLeague.status}`)}
          </span>
          <div className="text-end">
            <p className="rpg-stat-label text-rpg-muted">{t("lastMonth")}</p>
            <p className="rpg-stat-value text-rpg-muted">{ghostLeague.lastMonthXp}</p>
          </div>
        </div>
        <GhostLeagueChart thisWeekXP={ghostLeague.thisWeekXp} lastMonthXP={ghostLeague.lastMonthXp} />
        <p className="rpg-body mt-2 italic text-rpg-muted">{t("ghostCaption")}</p>
      </RPGCard>

      <RPGCard className="min-w-0">
        <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("meditationTrend")}</h2>
        <ChartContainer height={200}>
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={meditationTrend}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid stroke={CHART_GRID} strokeOpacity={0.6} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
                domain={[0, meditationMax]}
                allowDecimals={false}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke={CHART_GOLD}
                fill="rgba(212,175,55,0.12)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke={CHART_GOLD}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_GOLD, stroke: "#e2e2e2", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartContainer>
      </RPGCard>

      <RPGCard className="min-w-0">
        <h2 className="rpg-section-heading mb-1 text-rpg-gold">{t("activityHeatmap")}</h2>
        <p className="mb-4 text-sm text-rpg-secondary">{t("heatmapSubtitle")}</p>
        <ActivityHeatmap days={heatmapDays} />
      </RPGCard>
    </div>
  );
}

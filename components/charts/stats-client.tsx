"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { cn } from "@/lib/utils";
import { ActivityHeatmap, type HeatmapDay } from "@/components/charts/activity-heatmap";
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

function ChartFrame({
  className,
  height,
  children,
}: {
  className?: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("w-full min-w-0 max-w-full overflow-hidden", className)}
      style={{ height }}
    >
      {children ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export function StatsClient({ weeklyXp, radar, meditationTrend: initialTrend, heatmapDays, ghostLeague }: Props) {
  const t = useTranslations("stats");
  const [mounted, setMounted] = useState(false);
  const [meditationTrend, setMeditationTrend] = useState(initialTrend);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <RPGCard className="min-w-0 overflow-hidden">
          <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("weeklyXp")}</h2>
          <ChartFrame height={180}>
            {mounted ? (
              <BarChart data={weeklyXp} margin={barChartMargin} barCategoryGap="20%" barGap={4}>
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
                <Bar dataKey="xp" fill={CHART_PURPLE} radius={[6, 6, 0, 0]} maxBarSize={56} minPointSize={4} />
              </BarChart>
            ) : null}
          </ChartFrame>
        </RPGCard>

        <RPGCard className="min-w-0 overflow-hidden">
          <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("lifeBalance")}</h2>
          <ChartFrame className="mx-auto max-w-[280px]" height={180}>
            {mounted ? (
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke={CHART_GRID} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_TICK, fontSize: 10 }} />
                <Radar
                  name="Life Balance"
                  dataKey="value"
                  stroke={CHART_PURPLE}
                  strokeWidth={2}
                  fill={CHART_PURPLE}
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            ) : null}
          </ChartFrame>
        </RPGCard>
      </div>

      <RPGCard className="min-w-0 w-full overflow-hidden">
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

      <RPGCard className="min-w-0 overflow-hidden">
        <h2 className="rpg-section-heading mb-3 text-rpg-gold">{t("meditationTrend")}</h2>
        <ChartFrame height={200}>
          {mounted ? (
            <LineChart data={meditationTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={CHART_GRID} strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="week" tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Area type="monotone" dataKey="minutes" stroke={CHART_GOLD} fill="rgba(212,175,55,0.1)" />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke={CHART_GOLD}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_GOLD, stroke: "#e2e2e2", strokeWidth: 2 }}
              />
            </LineChart>
          ) : null}
        </ChartFrame>
      </RPGCard>

      <RPGCard className="min-w-0">
        <h2 className="rpg-section-heading mb-1 text-rpg-gold">{t("activityHeatmap")}</h2>
        <p className="mb-4 text-sm text-rpg-secondary">{t("heatmapSubtitle")}</p>
        <ActivityHeatmap days={heatmapDays} />
      </RPGCard>
    </div>
  );
}

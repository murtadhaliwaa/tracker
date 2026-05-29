"use client";

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/charts/chart-container";

type Props = {
  thisWeekXP: number;
  lastMonthXP: number;
};

const CHART_TICK = "#666688";

export function GhostLeagueChart({ thisWeekXP, lastMonthXP }: Props) {
  const ghostChartData = [
    { label: "This Week", score: Number(thisWeekXP) || 0 },
    { label: "Last Month", score: Number(lastMonthXP) || 0 },
  ];

  const maxScore = Math.max(...ghostChartData.map((d) => d.score), 1);

  return (
    <ChartContainer height={200} className="mt-3">
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={ghostChartData}
          margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
          barCategoryGap="40%"
          maxBarSize={72}
        >
          <XAxis dataKey="label" stroke={CHART_TICK} tick={{ fill: CHART_TICK, fontSize: 12 }} />
          <YAxis
            stroke={CHART_TICK}
            tick={{ fill: CHART_TICK, fontSize: 12 }}
            width={40}
            domain={[0, maxScore]}
            allowDecimals={false}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false} minPointSize={4}>
            <Cell key="this-week" fill="#D4AF37" />
            <Cell key="last-month" fill="#7C3AED" />
          </Bar>
        </BarChart>
      )}
    </ChartContainer>
  );
}

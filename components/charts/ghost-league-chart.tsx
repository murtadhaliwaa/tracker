"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Props = {
  thisWeekXP: number;
  lastMonthXP: number;
};

export function GhostLeagueChart({ thisWeekXP, lastMonthXP }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ghostChartData = [
    { label: "This Week", score: Number(thisWeekXP) || 0 },
    { label: "Last Month", score: Number(lastMonthXP) || 0 },
  ];

  return (
    <div
      className="min-w-0 max-w-full overflow-hidden"
      style={{
        width: "100%",
        height: 200,
      }}
    >
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart
            data={ghostChartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            barCategoryGap="40%"
            maxBarSize={72}
          >
            <XAxis dataKey="label" stroke="#666688" tick={{ fill: "#666688", fontSize: 12 }} />
            <YAxis stroke="#666688" tick={{ fill: "#666688", fontSize: 12 }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <Cell key="this-week" fill="#D4AF37" />
              <Cell key="last-month" fill="#7C3AED" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

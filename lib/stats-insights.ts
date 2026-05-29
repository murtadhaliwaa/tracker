import { startOfDay, subDays } from "date-fns";
import type { LifeBalanceDimension } from "@/lib/life-balance-radar";

type HeatmapDay = { date: string; count: number };

export type StatInfoKey =
  | "weeklyXp"
  | "lifeBalance"
  | "ghostLeague"
  | "meditationTrend"
  | "activityHeatmap";

export type InsightContent = {
  insight: string;
  encouragement: string;
  action: string;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function absPct(value: number): number {
  return Math.abs(value);
}

function sumHeatmapBetween(days: HeatmapDay[], from: Date, to: Date): number {
  const fromMs = startOfDay(from).getTime();
  const toMs = startOfDay(to).getTime();
  return days.reduce((sum, day) => {
    const ms = startOfDay(new Date(day.date)).getTime();
    if (ms >= fromMs && ms <= toMs) return sum + day.count;
    return sum;
  }, 0);
}

export function buildWeeklyXpInsight(weeklyXp: { name: string; xp: number }[], t: Translate): InsightContent {
  const current = weeklyXp[0]?.xp ?? 0;
  const previous = weeklyXp[1]?.xp ?? 0;
  const percent = pctChange(current, previous);

  if (current === 0 && previous === 0) {
    return {
      insight: t("insights.weeklyXp.emptyInsight"),
      encouragement: t("insights.weeklyXp.emptyEncourage"),
      action: t("insights.weeklyXp.emptyAction"),
    };
  }

  if (current > previous) {
    return {
      insight: t("insights.weeklyXp.upInsight", { current, previous, percent: absPct(percent) }),
      encouragement: t("insights.weeklyXp.upEncourage"),
      action: t("insights.weeklyXp.upAction"),
    };
  }

  if (current < previous) {
    return {
      insight: t("insights.weeklyXp.downInsight", { current, previous, percent: absPct(percent) }),
      encouragement: t("insights.weeklyXp.downEncourage"),
      action: t("insights.weeklyXp.downAction"),
    };
  }

  return {
    insight: t("insights.weeklyXp.flatInsight", { current, previous }),
    encouragement: t("insights.weeklyXp.flatEncourage"),
    action: t("insights.weeklyXp.flatAction"),
  };
}

export function buildLifeBalanceInsight(
  radar: { subject: LifeBalanceDimension; value: number }[],
  t: Translate,
): InsightContent {
  if (radar.length === 0) {
    return {
      insight: t("insights.lifeBalance.emptyInsight"),
      encouragement: t("insights.lifeBalance.emptyEncourage"),
      action: t("insights.lifeBalance.emptyAction"),
    };
  }

  const sorted = [...radar].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const gap = strongest.value - weakest.value;
  const isBalanced = gap <= 15;
  const strongestLabel = t(`lifeBalanceDimensions.${strongest.subject}`);
  const weakestLabel = t(`lifeBalanceDimensions.${weakest.subject}`);

  if (isBalanced) {
    return {
      insight: t("insights.lifeBalance.balancedInsight", {
        strongest: strongestLabel,
        weakest: weakestLabel,
      }),
      encouragement: t("insights.lifeBalance.balancedEncourage"),
      action: t("insights.lifeBalance.balancedAction"),
    };
  }

  return {
    insight: t("insights.lifeBalance.skewedInsight", {
      strongest: strongestLabel,
      strongestValue: strongest.value,
      weakest: weakestLabel,
      weakestValue: weakest.value,
      gap,
    }),
    encouragement: t("insights.lifeBalance.skewedEncourage", { weakest: weakestLabel }),
    action: t("insights.lifeBalance.skewedAction", { weakest: weakestLabel }),
  };
}

export function buildGhostLeagueInsight(
  ghost: { thisWeekXp: number; lastMonthXp: number; status: "ahead" | "behind" | "tied" },
  t: Translate,
): InsightContent {
  const { thisWeekXp, lastMonthXp, status } = ghost;
  const percent = pctChange(thisWeekXp, lastMonthXp);

  if (thisWeekXp === 0 && lastMonthXp === 0) {
    return {
      insight: t("insights.ghostLeague.emptyInsight"),
      encouragement: t("insights.ghostLeague.emptyEncourage"),
      action: t("insights.ghostLeague.emptyAction"),
    };
  }

  if (status === "ahead") {
    return {
      insight: t("insights.ghostLeague.aheadInsight", {
        thisWeek: thisWeekXp,
        lastMonth: lastMonthXp,
        percent: absPct(percent),
      }),
      encouragement: t("insights.ghostLeague.aheadEncourage"),
      action: t("insights.ghostLeague.aheadAction"),
    };
  }

  if (status === "behind") {
    return {
      insight: t("insights.ghostLeague.behindInsight", {
        thisWeek: thisWeekXp,
        lastMonth: lastMonthXp,
        percent: absPct(percent),
      }),
      encouragement: t("insights.ghostLeague.behindEncourage"),
      action: t("insights.ghostLeague.behindAction"),
    };
  }

  return {
    insight: t("insights.ghostLeague.tiedInsight", { thisWeek: thisWeekXp, lastMonth: lastMonthXp }),
    encouragement: t("insights.ghostLeague.tiedEncourage"),
    action: t("insights.ghostLeague.tiedAction"),
  };
}

export function buildMeditationInsight(
  trend: { week: string; minutes: number }[],
  t: Translate,
): InsightContent {
  const current = trend[trend.length - 1]?.minutes ?? 0;
  const previous = trend[trend.length - 2]?.minutes ?? 0;
  const percent = pctChange(current, previous);

  if (current === 0 && previous === 0) {
    return {
      insight: t("insights.meditationTrend.emptyInsight"),
      encouragement: t("insights.meditationTrend.emptyEncourage"),
      action: t("insights.meditationTrend.emptyAction"),
    };
  }

  if (current > previous) {
    return {
      insight: t("insights.meditationTrend.upInsight", {
        current,
        previous,
        percent: absPct(percent),
      }),
      encouragement: t("insights.meditationTrend.upEncourage"),
      action: t("insights.meditationTrend.upAction"),
    };
  }

  if (current < previous) {
    return {
      insight: t("insights.meditationTrend.downInsight", {
        current,
        previous,
        percent: absPct(percent),
      }),
      encouragement: t("insights.meditationTrend.downEncourage"),
      action: t("insights.meditationTrend.downAction"),
    };
  }

  return {
    insight: t("insights.meditationTrend.flatInsight", { current, previous }),
    encouragement: t("insights.meditationTrend.flatEncourage"),
    action: t("insights.meditationTrend.flatAction"),
  };
}

export function buildHeatmapInsight(days: HeatmapDay[], t: Translate): InsightContent {
  const today = startOfDay(new Date());
  const thisWeekStart = subDays(today, 6);
  const lastWeekStart = subDays(today, 13);
  const lastWeekEnd = subDays(today, 7);

  const thisWeek = sumHeatmapBetween(days, thisWeekStart, today);
  const lastWeek = sumHeatmapBetween(days, lastWeekStart, lastWeekEnd);
  const percent = pctChange(thisWeek, lastWeek);

  if (thisWeek === 0 && lastWeek === 0) {
    return {
      insight: t("insights.activityHeatmap.emptyInsight"),
      encouragement: t("insights.activityHeatmap.emptyEncourage"),
      action: t("insights.activityHeatmap.emptyAction"),
    };
  }

  if (thisWeek > lastWeek) {
    return {
      insight: t("insights.activityHeatmap.upInsight", {
        thisWeek,
        lastWeek,
        percent: absPct(percent),
      }),
      encouragement: t("insights.activityHeatmap.upEncourage"),
      action: t("insights.activityHeatmap.upAction"),
    };
  }

  if (thisWeek < lastWeek) {
    return {
      insight: t("insights.activityHeatmap.downInsight", {
        thisWeek,
        lastWeek,
        percent: absPct(percent),
      }),
      encouragement: t("insights.activityHeatmap.downEncourage"),
      action: t("insights.activityHeatmap.downAction"),
    };
  }

  return {
    insight: t("insights.activityHeatmap.flatInsight", { thisWeek, lastWeek }),
    encouragement: t("insights.activityHeatmap.flatEncourage"),
    action: t("insights.activityHeatmap.flatAction"),
  };
}

export function buildStatInsight(
  infoKey: StatInfoKey,
  t: Translate,
  data: {
    weeklyXp: { name: string; xp: number }[];
    radar: { subject: LifeBalanceDimension; value: number }[];
    ghostLeague: { thisWeekXp: number; lastMonthXp: number; status: "ahead" | "behind" | "tied" };
    meditationTrend: { week: string; minutes: number }[];
    heatmapDays: HeatmapDay[];
  },
): InsightContent {
  switch (infoKey) {
    case "weeklyXp":
      return buildWeeklyXpInsight(data.weeklyXp, t);
    case "lifeBalance":
      return buildLifeBalanceInsight(data.radar, t);
    case "ghostLeague":
      return buildGhostLeagueInsight(data.ghostLeague, t);
    case "meditationTrend":
      return buildMeditationInsight(data.meditationTrend, t);
    case "activityHeatmap":
      return buildHeatmapInsight(data.heatmapDays, t);
  }
}

export function getStatInsightTitle(infoKey: StatInfoKey, t: Translate): string {
  switch (infoKey) {
    case "weeklyXp":
      return t("weeklyXp");
    case "lifeBalance":
      return t("lifeBalance");
    case "ghostLeague":
      return t("ghostLeague");
    case "meditationTrend":
      return t("meditationTrend");
    case "activityHeatmap":
      return t("activityHeatmap");
  }
}

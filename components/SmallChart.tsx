// components/SmallChart.tsx
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import type { HistoryPoint } from "../src/types";

export type RangeKey =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "2Y"
  | "5Y"
  | "Max";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_HORIZONTAL_PADDING = 24;
const WIDTH = Math.max(320, SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2);
const HEIGHT = 220;
const DEFAULT_COLOR_HEX = "#007aff";
const DEFAULT_MAX_POINTS = 200; // keep charts snappy

function safeHexToRgba(hex: unknown, alpha = 1, fallback = `rgba(0,122,255,${alpha})`) {
  if (!hex || typeof hex !== "string") return fallback;
  let s = hex.replace("#", "").trim();
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length !== 6) return fallback;
  const parsed = parseInt(s, 16);
  if (Number.isNaN(parsed)) return fallback;
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function timeHHMMFromDate(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function monthsShort(i: number) {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i];
}
function weekdaysShort(i: number) {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i];
}

/** Format labels per range */
function formatSingleLabelForRange(dateStr: string, range: RangeKey) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (range === "1D") return timeHHMMFromDate(d);
  if (range === "5D") return `${weekdaysShort(d.getDay())} ${d.getDate()}`; // Mon 11
  if (range === "1M" || range === "3M" || range === "6M") return `${monthsShort(d.getMonth())} ${d.getDate()}`; // Dec 11
  if (range === "1Y" || range === "2Y") return `${monthsShort(d.getMonth())} ${String(d.getFullYear()).slice(-2)}`; // Dec 24
  // 5Y or Max
  return String(d.getFullYear());
}

/** downsample evenly to at most max points while preserving first & last points */
function downsampleEvenly<T>(arr: T[], max: number) {
  if (arr.length <= max) return arr;
  const out: T[] = [];
  const n = arr.length;
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i * (n - 1)) / (max - 1));
    out.push(arr[idx]);
  }
  return out;
}

/** Group series indices by calendar day (yyyy-mm-dd) and return first index for each day */
function firstIndexPerDay(series: HistoryPoint[]) {
  const map = new Map<string, number>();
  for (let i = 0; i < series.length; i++) {
    const d = new Date(series[i].date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    if (!map.has(key)) map.set(key, i);
  }
  return Array.from(map.values()).sort((a,b) => a-b);
}

/** get numeric days for ranges (approx) */
function daysForRange(range: RangeKey) {
  switch (range) {
    case "1D": return 1;
    case "5D": return 7; // include weekends buffer if data sparse
    case "1M": return 30;
    case "3M": return 90;
    case "6M": return 180;
    case "1Y": return 365;
    case "2Y": return 365 * 2;
    case "5Y": return 365 * 5;
    default: return Infinity;
  }
}

/** select the series to use based on range:
 * - for short ranges: slice last maxPoints
 * - for multi-day ranges: try to select last N days (calendar-aware) then downsample if required
 * - for 5Y/Max: use full history but downsample if necessary
 */
function getSeriesForRange(all: HistoryPoint[], range: RangeKey, maxPoints: number) {
  if (!Array.isArray(all) || all.length === 0) return [];

  const now = Date.now();
  const days = daysForRange(range);

  // If it's 1D, keep last MAX points (intraday) — do not collapse to one-per-day
  if (range === "1D") {
    return all.slice(-maxPoints);
  }

  // For other finite-day ranges, try to include last `days` days by timestamp
  if (isFinite(days)) {
    // find cutoff time
    const cutoff = now - days * 24 * 3600 * 1000;
    // keep all points whose timestamp >= cutoff
    const filtered = all.filter((p) => {
      const t = new Date(p.date).getTime();
      return !isNaN(t) && t >= cutoff;
    });

    // if filtered is empty (maybe timestamps are weird), fall back to slice
    if (filtered.length === 0) {
      const fallback = all.slice(-maxPoints);
      return fallback;
    }

    // if this is 5D we want 1 marker per day, so keep all and later choose ticks from firstIndexPerDay
    // For display/performance, downsample if too many points
    if (filtered.length > maxPoints) {
      return downsampleEvenly(filtered, maxPoints);
    }
    return filtered;
  }

  // 5Y or Max -> keep full history but downsample
  const max = Math.max(maxPoints, 500); // allow more points for long ranges but keep reasonable
  if (all.length > max) return downsampleEvenly(all, max);
  return all;
}

/** pick tick indices based on range and series */
function chooseTickIndices(series: HistoryPoint[], range: RangeKey) {
  const n = series.length;
  if (n === 0) return [];

  // Special handling for 5D: try to pick first index of each day (max 5)
  if (range === "5D") {
    const dayIndices = firstIndexPerDay(series);
    // limit to 5 days (last 5 found)
    const lastNDays = dayIndices.slice(-5);
    return lastNDays;
  }

  // For 1D show up to 6 intraday ticks (evenly spaced)
  if (range === "1D") {
    const ticks = Math.min(6, n);
    const out: number[] = [];
    for (let i = 0; i < ticks; i++) out.push(Math.round((i * (n - 1)) / (ticks - 1)));
    return Array.from(new Set(out)).sort((a,b) => a-b);
  }

  // For 1Y show 4 quarterly-ish ticks
  if (range === "1Y") {
    const ticks = Math.min(4, n);
    const out: number[] = [];
    for (let i = 0; i < ticks; i++) out.push(Math.round((i * (n - 1)) / (ticks - 1)));
    return Array.from(new Set(out)).sort((a,b) => a-b);
  }

  // For 2Y show 4 ticks (approx 6-month gaps)
  if (range === "2Y") {
    const ticks = 4;
    const out: number[] = [];
    for (let i = 0; i < ticks; i++) out.push(Math.round((i * (n - 1)) / (ticks - 1)));
    return Array.from(new Set(out)).sort((a,b) => a-b);
  }

  // For 5Y/Max show up to 6 ticks (years)
  if (range === "5Y" || range === "Max") {
    const ticks = Math.min(6, n);
    const out: number[] = [];
    for (let i = 0; i < ticks; i++) out.push(Math.round((i * (n - 1)) / (ticks - 1)));
    return Array.from(new Set(out)).sort((a,b) => a-b);
  }

  // default for monthly-ish ranges: 4-6 ticks
  const ticks = Math.min(6, n);
  const out: number[] = [];
  for (let i = 0; i < ticks; i++) out.push(Math.round((i * (n - 1)) / (ticks - 1)));
  return Array.from(new Set(out)).sort((a,b) => a-b);
}

export default function SmallChart({
  history,
  range = "1M",
  lineColor,
  maxPoints = DEFAULT_MAX_POINTS,
  onDataPoint,
}: {
  history: HistoryPoint[];
  range?: RangeKey;
  lineColor?: string;
  maxPoints?: number;
  onDataPoint?: (payload: { index: number; value: number; x?: number; y?: number }) => void;
}) {
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <View style={[styles.container, { height: HEIGHT, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#666" }}>Chart unavailable</Text>
      </View>
    );
  }

  // choose series per range (ensures 1Y covers ~365 days, 5D picks days etc.)
  const series = getSeriesForRange(history, range, maxPoints);

  const chartData = useMemo(() => {
    const values = series.map((s) => (s && typeof s.close === "number" ? s.close : Number(s?.close ?? 0)));

    // pick tick indices appropriate for the range
    const tickIndices = chooseTickIndices(series, range);

    // labels at tick indices
    let rawLabels = tickIndices.map((i) => formatSingleLabelForRange(series[i]?.date ?? "", range));

    // If all raw labels are identical or empty (rare), create interpolated labels between first+last timestamps
    const allSame = rawLabels.length > 0 && rawLabels.every((lbl) => lbl === rawLabels[0] || !lbl);
    let labelsForTicks = rawLabels;
    if (allSame) {
      const firstT = new Date(series[0]?.date).getTime();
      const lastT = new Date(series[series.length - 1]?.date).getTime();
      if (!isNaN(firstT) && !isNaN(lastT) && firstT !== lastT) {
        labelsForTicks = tickIndices.map((idx) => {
          const t = Math.round(firstT + ((lastT - firstT) * idx) / (series.length - 1));
          return formatSingleLabelForRange(new Date(t).toISOString(), range);
        });
      }
    }

    // build full labels array (label at chosen indices, else "")
    const fullLabels = series.map((_, i) => {
      const pos = tickIndices.indexOf(i);
      return pos >= 0 ? labelsForTicks[pos] : "";
    });

    return { labels: fullLabels, datasets: [{ data: values }] as any[] };
  }, [series, range]);

  const colorFn = (opacity = 1) => safeHexToRgba(lineColor ?? DEFAULT_COLOR_HEX, opacity);

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={WIDTH - 8} // stay inside the card; avoids overflow
        height={HEIGHT}
        withDots={false}
        withInnerLines={false}
        withVerticalLines={false}
        withHorizontalLines={false}
        yAxisLabel={""}
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          backgroundGradientFromOpacity: 1,
          backgroundGradientToOpacity: 1,

          color: (opacity = 1) => colorFn(opacity),
          fillShadowGradient: safeHexToRgba(lineColor ?? DEFAULT_COLOR_HEX, 1),
          fillShadowGradientOpacity: 0.12,

          decimalPlaces: 2,
          strokeWidth: 2,
          labelColor: (opacity = 1) => `rgba(100,100,100,${Math.max(0.6, opacity * 0.9)})`,

          propsForBackgroundLines: { stroke: "transparent" },
          propsForDots: { r: "0" },
        }}
        bezier
        style={chartStyles.chart}
        onDataPointClick={(data) => {
          if (!data) return;
          const index = typeof data?.index === "number" ? data.index : Number(data?.index ?? -1);
          const value = typeof data?.value === "number" ? data.value : Number(data?.value ?? 0);
          const x = typeof data?.x === "number" ? data.x : undefined;
          const y = typeof data?.y === "number" ? data.y : undefined;
          if (typeof index === "number" && index >= 0 && onDataPoint) {
            onDataPoint({ index, value, x, y });
          }
        }}
        fromZero={false}
        formatYLabel={(y) => (y === null || y === undefined ? "-" : String(y))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 12,
    // subtle elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden", // ensure nothing draws outside card
  },
});

const chartStyles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    paddingRight: 24, // prevents rightmost label/line from being clipped
    marginLeft: -4,
  },
});

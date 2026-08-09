import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../src/config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  '₹' +
  (val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtCompact = (val: number): string => {
  if (val >= 10_000_000) return '₹' + (val / 10_000_000).toFixed(2) + ' Cr';
  if (val >= 100_000) return '₹' + (val / 100_000).toFixed(2) + ' L';
  if (val >= 1_000) return '₹' + (val / 1_000).toFixed(2) + ' K';
  return '₹' + (val || 0).toFixed(2);
};

const makeYLabel = (yOff: number) => (raw: string): string => {
  const n = parseFloat(raw) + yOff;
  if (isNaN(n) || n <= 0) return '';
  if (n >= 100_000) return (n / 100_000).toFixed(1) + 'L';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  return new Date(dateStr.replace(' ', 'T'));
};

const TIMEFRAMES = [
  { label: '1D', period: '1d', interval: '5m' },
  { label: '1W', period: '5d', interval: '15m' },
  { label: '1M', period: '1mo', interval: '1d' },
  { label: '6M', period: '6mo', interval: '1d' },
  { label: '1Y', period: '1y', interval: '1d' },
];

function StatCell({
  label,
  value,
  color,
  textSec,
  textPri,
}: {
  label: string;
  value: string;
  color?: string;
  textSec: string;
  textPri: string;
}) {
  return (
    <View style={SC.wrap}>
      <Text style={[SC.label, { color: textSec }]}>{label}</Text>
      <Text style={[SC.value, { color: color || textPri }]}>{value}</Text>
    </View>
  );
}

const SC = StyleSheet.create({
  wrap: { flex: 1, minWidth: '45%', marginBottom: 14 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: { fontSize: 15, fontWeight: '800' },
});

export default function StockDetailScreen() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeRange, setActiveRange] = useState(TIMEFRAMES[0]); // default to 1D
  const [chartData, setChartData] = useState<any[]>([]);
  const [stockMeta, setStockMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);

  const isLandscape = width > height;

  useEffect(() => {
    fetchStockData();
  }, [symbol, activeRange]);

  useEffect(
    () => () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    },
    []
  );

  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/stock?symbol=${symbol}&period=${activeRange.period}&interval=${activeRange.interval}`
      );
      const data = await res.json();
      if (data?.history?.length > 0) {
        setStockMeta(data.meta);

        const formatted = data.history.map((p: any) => ({
          value: p.close,
          fullDate: p.date || p.Datetime,
        }));

        setChartData(formatted);
        setSliderIndex(formatted.length - 1);
      } else {
        setChartData([]);
      }
    } catch (e) {
      console.error('Stock fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLandscape = async () => {
    await ScreenOrientation.lockAsync(
      isLandscape
        ? ScreenOrientation.OrientationLock.PORTRAIT_UP
        : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
    );
  };

  // Theme palette mapping
  const C = useMemo(
    () => ({
      bg: colors.background,
      card: colors.card,
      border: colors.border,
      textPri: colors.text,
      textSec: colors.textSecondary,
      green: '#089981',
      greenBg: isDark ? 'rgba(8,153,129,0.18)' : 'rgba(8,153,129,0.10)',
      red: '#f23645',
      redBg: isDark ? 'rgba(242,54,69,0.18)' : 'rgba(242,54,69,0.10)',
      pill: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
    }),
    [colors, isDark]
  );

  const first = chartData[0]?.value || 0;
  const last = chartData[chartData.length - 1]?.value || 0;
  const diff = last - first;
  const pct = first > 0 ? ((diff / first) * 100).toFixed(2) : '0.00';
  const isUp = last >= first;
  const accent = isUp ? C.green : C.red;
  const dimBg = isUp ? C.greenBg : C.redBg;

  const minP = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const maxP = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const yOff = minP * 0.995;
  const yRange = (maxP - yOff) * 1.05;

  const Y_W = 42;
  const containerWidth = isLandscape ? width * 0.95 : width - 24;
  const chartW = containerWidth - Y_W;
  const chartH = isLandscape ? 220 : 250;

  const spacing = chartData.length > 1 ? chartW / (chartData.length - 1) : 2;
  const fmtY = useCallback(makeYLabel(yOff), [yOff]);

  const yLabelStyle = useMemo(
    () => ({ color: C.textSec, fontSize: 9, fontWeight: '600' as const }),
    [C.textSec]
  );

  const sym = String(symbol).replace('.NS', '').replace('.BO', '');
  const dayHigh = stockMeta?.dayHigh ?? maxP;
  const dayLow = stockMeta?.dayLow ?? minP;
  const open = stockMeta?.open ?? first;
  const prevClose = stockMeta?.previousClose ?? first;
  const vol = stockMeta?.regularMarketVolume ?? 0;
  const mktCap = stockMeta?.marketCap ?? 0;

  // Safe continuous scrubber point with fluid linear interpolation
  const clampedIndex = Math.min(Math.max(0, sliderIndex), Math.max(0, chartData.length - 1));
  const lowerIdx = Math.floor(clampedIndex);
  const upperIdx = Math.min(chartData.length - 1, lowerIdx + 1);
  const fraction = clampedIndex - lowerIdx;

  const lowerPt = chartData[lowerIdx] || chartData[0];
  const upperPt = chartData[upperIdx] || lowerPt;

  const currentScrubValue = lowerPt ? lowerPt.value + (upperPt.value - lowerPt.value) * fraction : 0;
  const selectedPoint = chartData[Math.round(clampedIndex)] || lowerPt;

  let scrubDateText = '';
  let dotX = 0;
  let dotY = 0;
  let tooltipX = 0;

  if (selectedPoint && lowerPt) {
    const d = parseSafeDate(selectedPoint.fullDate);
    scrubDateText =
      activeRange.label === '1D'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    dotX = clampedIndex * spacing;
    dotY = chartH - ((currentScrubValue - yOff) / (yRange || 1)) * chartH;
    tooltipX = Math.max(0, Math.min(dotX - 50, chartW - 100));
  }

  const getXAxisLabels = () => {
    if (chartData.length === 0) return [];
    const steps = [0, 0.25, 0.5, 0.75, 1].map((f) =>
      Math.round(f * (chartData.length - 1))
    );
    return steps.map((idx) => {
      const p = chartData[idx];
      if (!p) return '';
      const d = parseSafeDate(p.fullDate);
      return activeRange.label === '1D'
        ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    });
  };

  const S = useMemo(() => getStyles(C), [C]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[S.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

        {/* ── HEADER ── */}
        {!isLandscape && (
          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={C.textPri} />
            </TouchableOpacity>
            <View style={S.headerMid}>
              <Text style={S.headerSym}>{sym}</Text>
              <View style={[S.badge, { backgroundColor: dimBg }]}>
                <Text style={[S.badgeTxt, { color: accent }]}>NSE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleLandscape} style={S.iconBtn}>
              <Ionicons name="expand-outline" size={22} color={C.textPri} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── FLOATING EXIT LANDSCAPE BUTTON ── */}
        {isLandscape && (
          <TouchableOpacity onPress={toggleLandscape} style={S.floatingExitBtn}>
            <Ionicons name="contract-outline" size={22} color={C.textPri} />
          </TouchableOpacity>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <ScrollView
          style={S.scroll}
          contentContainerStyle={[
            S.scrollContent,
            { width: containerWidth, alignSelf: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* PRICE BLOCK */}
          <View style={[S.priceBlock, isLandscape && { marginTop: 10 }]}>
            <Text style={S.co} numberOfLines={1}>
              {stockMeta?.resolved_name || sym}
            </Text>
            <Text style={S.price}>
              {stockMeta ? fmt(stockMeta.regularMarketPrice) : '—'}
            </Text>
            <View style={S.changeRow}>
              <View style={[S.changePill, { backgroundColor: dimBg }]}>
                <Ionicons
                  name={isUp ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={accent}
                  style={{ marginRight: 4 }}
                />
                <Text style={[S.changeAmt, { color: accent }]}>
                  {isUp ? '+' : ''}
                  {fmt(diff)}
                </Text>
              </View>
              <Text style={[S.changePct, { color: accent }]}>
                {isUp ? '+' : ''}
                {pct}%
              </Text>
              <Text style={S.changeRange}>· {activeRange.label}</Text>
            </View>

            {/* MARKET TIMING STATUS BADGE */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: stockMeta?.isMarketOpen
                  ? 'rgba(8,153,129,0.12)'
                  : 'rgba(242,54,69,0.12)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
                marginTop: 10,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: stockMeta?.isMarketOpen
                  ? 'rgba(8,153,129,0.3)'
                  : 'rgba(242,54,69,0.3)',
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: stockMeta?.isMarketOpen ? '#089981' : '#f23645',
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  color: stockMeta?.isMarketOpen ? '#089981' : '#f23645',
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {stockMeta?.isMarketOpen
                  ? '🟢 Live Market (09:15 - 15:30 IST)'
                  : '🔴 Market Closed • Showing data up to 3:30 PM IST'}
              </Text>
            </View>
          </View>

          {/* TIMEFRAME PILLS */}
          <View style={S.tfRow}>
            {TIMEFRAMES.map((tf) => {
              const on = activeRange.label === tf.label;
              return (
                <TouchableOpacity
                  key={tf.label}
                  style={[S.pill, on && { backgroundColor: accent }]}
                  onPress={() => setActiveRange(tf)}
                  activeOpacity={0.7}
                >
                  <Text style={[S.pillTxt, on && { color: '#ffffff', fontWeight: '800' }]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* THE CHART BLOCK */}
          <View style={S.chartWrap}>
            {isLoading ? (
              <View style={[S.centre, { height: chartH }]}>
                <ActivityIndicator size="large" color={accent} />
              </View>
            ) : chartData.length > 0 ? (
              <View>
                <View style={{ position: 'relative' }}>
                  {/* FLOATING TOOLTIP ON CURVE */}
                  {selectedPoint && (
                    <View
                      style={[
                        S.floatingTooltip,
                        {
                          left: tooltipX,
                          top: Math.max(dotY - 45, 0),
                          borderColor: accent,
                        },
                      ]}
                    >
                      <Text style={[S.scrubPrice, { color: accent }]}>
                        {fmt(currentScrubValue)}
                      </Text>
                      <Text style={S.scrubDate}>{scrubDateText}</Text>
                    </View>
                  )}

                  {/* THE SVG CHART */}
                  <LineChart
                    areaChart
                    data={chartData}
                    width={chartW}
                    height={chartH}
                    spacing={spacing}
                    initialSpacing={0}
                    endSpacing={0}
                    color={accent}
                    thickness={2.5}
                    hideDataPoints
                    yAxisOffset={yOff}
                    maxValue={yRange}
                    noOfSections={4}
                    yAxisSide={1}
                    yAxisLabelWidth={Y_W}
                    formatYLabel={fmtY}
                    yAxisTextStyle={yLabelStyle}
                    yAxisColor="transparent"
                    hideRules={false}
                    rulesType="solid"
                    rulesColor={C.border}
                    xAxisColor={C.border}
                    hideOrigin
                    xAxisTextNumberOfLines={0}
                    startFillColor={accent}
                    endFillColor={accent}
                    startOpacity={0.25}
                    endOpacity={0.0}
                  />

                  {/* DOT ON CURVE */}
                  {selectedPoint && (
                    <View
                      style={[
                        S.curveDot,
                        { left: dotX - 6, top: dotY - 6, backgroundColor: accent },
                      ]}
                    />
                  )}
                </View>

                {/* CUSTOM X-AXIS */}
                <View style={[S.customXAxis, { width: chartW }]}>
                  {getXAxisLabels().map((label, i) => (
                    <Text key={i} style={S.customXLabel}>
                      {label}
                    </Text>
                  ))}
                </View>

                {/* SMOOTH FAST TOUCH SLIDER */}
                <View style={S.sliderContainer}>
                  <Slider
                    style={{ width: chartW, height: 44, marginLeft: -12 }}
                    minimumValue={0}
                    maximumValue={chartData.length - 1}
                    step={1}
                    value={sliderIndex}
                    onValueChange={(val) => setSliderIndex(val)}
                    minimumTrackTintColor={accent}
                    maximumTrackTintColor={C.border}
                    thumbTintColor={accent}
                  />
                </View>
              </View>
            ) : (
              <View style={[S.centre, { height: chartH }]}>
                <Ionicons name="bar-chart-outline" size={40} color={C.textSec} />
                <Text style={S.emptyTxt}>No market data available</Text>
              </View>
            )}
          </View>

          {/* STATS BLOCK */}
          <View style={S.statsCard}>
            <View style={S.statsGrid}>
              <StatCell
                label="Day High"
                value={fmt(dayHigh)}
                textSec={C.textSec}
                textPri={C.textPri}
              />
              <StatCell
                label="Day Low"
                value={fmt(dayLow)}
                textSec={C.textSec}
                textPri={C.textPri}
              />
              <StatCell
                label="Open"
                value={fmt(open)}
                textSec={C.textSec}
                textPri={C.textPri}
              />
              <StatCell
                label="Prev Close"
                value={fmt(prevClose)}
                textSec={C.textSec}
                textPri={C.textPri}
              />
              <StatCell
                label="Volume"
                value={vol.toLocaleString('en-IN')}
                textSec={C.textSec}
                textPri={C.textPri}
              />
              <StatCell
                label="Market Cap"
                value={fmtCompact(mktCap)}
                textSec={C.textSec}
                textPri={C.textPri}
              />
            </View>
          </View>

          {/* TRADE ACTION BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: C.green,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
              flexDirection: 'row',
              gap: 8,
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => router.push('/(tabs)/trading')}
          >
            <Ionicons name="flash" size={18} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
              Trade {sym} on Virtual Exchange
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const getStyles = (C: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    iconBtn: { padding: 8, borderRadius: 10, backgroundColor: C.card },
    headerMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerSym: { fontSize: 18, fontWeight: '900', color: C.textPri },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeTxt: { fontSize: 11, fontWeight: '800' },
    floatingExitBtn: {
      position: 'absolute',
      top: 15,
      right: 15,
      zIndex: 99,
      padding: 10,
      backgroundColor: C.card,
      borderRadius: 12,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingVertical: 16, paddingBottom: 40 },

    priceBlock: { marginBottom: 16 },
    co: { fontSize: 13, color: C.textSec, fontWeight: '600', marginBottom: 4 },
    price: { fontSize: 32, fontWeight: '900', color: C.textPri, letterSpacing: -0.5 },
    changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    changePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    changeAmt: { fontSize: 13, fontWeight: '800' },
    changePct: { fontSize: 13, fontWeight: '800' },
    changeRange: { fontSize: 12, color: C.textSec, fontWeight: '600' },

    tfRow: {
      flexDirection: 'row',
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    pill: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    pillTxt: { fontSize: 12, color: C.textSec, fontWeight: '700' },

    chartWrap: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
      elevation: 2,
    },
    centre: { alignItems: 'center', justifyContent: 'center' },
    emptyTxt: { color: C.textSec, fontSize: 13, marginTop: 8, fontWeight: '600' },

    floatingTooltip: {
      position: 'absolute',
      backgroundColor: C.bg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      zIndex: 10,
      elevation: 4,
    },
    scrubPrice: { fontSize: 12, fontWeight: '800' },
    scrubDate: { fontSize: 9, color: C.textSec, fontWeight: '600' },
    curveDot: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#ffffff',
      zIndex: 11,
    },

    customXAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    customXLabel: { fontSize: 9, color: C.textSec, fontWeight: '600' },

    sliderContainer: { marginTop: 12, alignItems: 'center' },

    statsCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  });
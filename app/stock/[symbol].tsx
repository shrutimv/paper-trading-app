import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import * as ScreenOrientation from 'expo-screen-orientation';

import { API_BASE_URL } from '../../src/config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtCompact = (val: number): string => {
  if (val >= 10_000_000) return '₹' + (val / 10_000_000).toFixed(2) + ' Cr';
  if (val >= 100_000)    return '₹' + (val / 100_000).toFixed(2) + ' L';
  if (val >= 1_000)      return '₹' + (val / 1_000).toFixed(2) + ' K';
  return '₹' + val.toFixed(2);
};

const makeYLabel = (yOff: number) => (raw: string): string => {
  const n = parseFloat(raw) + yOff;
  if (isNaN(n) || n <= 0) return '';
  if (n >= 100_000) return (n / 100_000).toFixed(1) + 'L';
  if (n >= 1_000)   return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
};

const TIMEFRAMES = [
  { label: '1D', period: '1d',  interval: '5m'  },
  { label: '1W', period: '5d',  interval: '15m' },
  { label: '1M', period: '1mo', interval: '1d'  },
  { label: '6M', period: '6mo', interval: '1d'  },
  { label: '1Y', period: '1y',  interval: '1d'  },
];

const C = {
  bg:      '#0d0d12',
  surface: '#13131a',
  card:    '#17171f',
  border:  '#252535',
  axis:    '#c0c0e0',
  textPri: '#f0f0f8',
  textSec: '#8888aa',
  green:   '#00c896',
  greenBg: 'rgba(0,200,150,0.12)',
  red:     '#ff4757',
  redBg:   'rgba(255,71,87,0.12)',
  pill:    '#1e1e2c',
};

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────
const Tooltip = React.memo(
  ({ date, price, color }: { date: string; price: string; color: string }) => (
    <View style={[TT.box, { borderColor: color + '66' }]}>
      <Text style={TT.date}>{date}</Text>
      <Text style={[TT.price, { color }]}>{price}</Text>
    </View>
  )
);
const TT = StyleSheet.create({
  box: {
    backgroundColor: '#1a1a26',
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 6, paddingHorizontal: 10,
    alignItems: 'center', minWidth: 110,
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.6,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  date:  { color: '#c0c0e0', fontSize: 11, fontWeight: '600', marginBottom: 1 },
  price: { fontSize: 13, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Info stat cell
// ─────────────────────────────────────────────────────────────────────────────
function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={SC.wrap}>
      <Text style={SC.label}>{label}</Text>
      <Text style={[SC.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}
const SC = StyleSheet.create({
  wrap:  { flex: 1, minWidth: '45%', marginBottom: 14 },
  label: { fontSize: 10, color: '#8888aa', fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: '#f0f0f8', fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function StockDetailScreen() {
  const router            = useRouter();
  const { symbol }        = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const insets            = useSafeAreaInsets();

  const [activeRange, setActiveRange] = useState(TIMEFRAMES[3]);
  const [chartData,   setChartData]   = useState<any[]>([]);
  const [stockMeta,   setStockMeta]   = useState<any>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  const isLandscape = width > height;

  useEffect(() => { fetchStockData(); }, [symbol, activeRange]);
  useEffect(() => () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(
        `${API_BASE_URL}/stock?symbol=${symbol}&period=${activeRange.period}&interval=${activeRange.interval}`
      );
      const data = await res.json();
      if (data?.history?.length > 0) {
        setStockMeta(data.meta);
        const arr    = data.history;
        const steps  = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * (arr.length - 1)));
        const formatted = arr.map((p: any, i: number) => {
          const d = new Date(p.date || p.Datetime);
          const showLabel = steps.includes(i);
          const label = showLabel
            ? activeRange.label === '1D'
              ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
              : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
            : '';
          return { value: p.close, label, fullDate: p.date || p.Datetime };
        });
        setChartData(formatted);
      } else {
        setChartData([]);
      }
    } catch (e) {
      console.error(e);
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

  // ── derived ───────────────────────────────────────────────────────────────
  const first  = chartData[0]?.value || 0;
  const last   = chartData[chartData.length - 1]?.value || 0;
  const diff   = last - first;
  const pct    = first > 0 ? ((diff / first) * 100).toFixed(2) : '0.00';
  const isUp   = last >= first;
  const accent = isUp ? C.green : C.red;
  const dimBg  = isUp ? C.greenBg : C.redBg;

  const minP   = chartData.length > 0 ? Math.min(...chartData.map(d => d.value)) : 0;
  const maxP   = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;
  const yOff   = minP * 0.995;
  const yRange = (maxP - yOff) * 1.06;

  // ── chart sizing ──────────────────────────────────────────────────────────
  const Y_W  = 52;
  const SIDE = 8;

  // Portrait: 280px tall, full-width chart
  // Landscape: 200px tall (smaller!), slightly narrower so it breathes
  const chartH = isLandscape ? 190 : 280;
  const chartW = isLandscape ? width - SIDE * 2 - 32 : width - SIDE * 2;

  const drawableW = chartW - Y_W - 8;
  const spacing   = chartData.length > 1
    ? Math.max(drawableW / (chartData.length - 1), 0.5)
    : 2;

  // ── stable callbacks ──────────────────────────────────────────────────────
  const fmtY = useCallback(makeYLabel(yOff), [yOff]);

  const tooltipComponent = useCallback((items: any[]) => {
    const raw = items[0]?.fullDate;
    const d   = raw ? new Date(raw) : new Date();
    const dateStr = activeRange.label === '1D'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return <Tooltip date={dateStr} price={fmt(items[0]?.value ?? 0)} color={accent} />;
  }, [activeRange.label, accent]);

  const ptrConfig = useMemo(() => ({
    pointerStripHeight:             chartH,
    pointerStripColor:              '#55557a',
    pointerStripWidth:              1.5,
    pointerStripUptoDataPoint:      true,
    pointerColor:                   accent,
    radius:                         5,
    activatePointersOnLongPress:    false,
    autoAdjustPointerLabelPosition: true,
    pointerLabelComponent:          tooltipComponent,
  }), [chartH, accent, tooltipComponent]);

  // Plain objects — NOT StyleSheet refs (gifted-charts ignores those)
  const yLabelStyle = { color: '#c0c0e0', fontSize: 11, fontWeight: '700' as const };
  const xLabelStyle = { color: '#c0c0e0', fontSize: 10, fontWeight: '600' as const };

  const sym       = String(symbol).replace('.NS', '');
  const dayHigh   = stockMeta?.dayHigh   ?? stockMeta?.regularMarketDayHigh           ?? maxP;
  const dayLow    = stockMeta?.dayLow    ?? stockMeta?.regularMarketDayLow            ?? minP;
  const open      = stockMeta?.open      ?? stockMeta?.regularMarketOpen              ?? first;
  const prevClose = stockMeta?.previousClose ?? stockMeta?.regularMarketPreviousClose ?? 0;
  const vol       = stockMeta?.regularMarketVolume ?? 0;
  const mktCap    = stockMeta?.marketCap ?? 0;

  // ── shared chart + info block (used in both orientations) ─────────────────
  const ChartBlock = (
    <View style={[S.chartWrap, { paddingHorizontal: isLandscape ? SIDE + 16 : SIDE }]}>
      {isLoading ? (
        <View style={[S.centre, { height: chartH }]}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={S.loadTxt}>Fetching market data…</Text>
        </View>
      ) : chartData.length > 0 ? (
        <LineChart
          areaChart
          data={chartData}
          width={chartW}
          height={chartH}
          spacing={spacing}
          initialSpacing={4}
          endSpacing={4}
          color={accent}
          thickness={2}
          hideDataPoints
          yAxisOffset={yOff}
          maxValue={yRange}
          noOfSections={4}
          yAxisSide={1}
          yAxisLabelWidth={Y_W}
          formatYLabel={fmtY}
          yAxisTextStyle={yLabelStyle}
          yAxisColor={C.border}
          yAxisThickness={1}
          xAxisColor={C.border}
          xAxisThickness={1}
          xAxisLabelTextStyle={xLabelStyle}
          showVerticalLines
          verticalLinesColor={C.border}
          rulesType="solid"
          rulesColor={C.border}
          startFillColor={accent}
          endFillColor={accent}
          startOpacity={0.2}
          endOpacity={0.0}
          pointerConfig={ptrConfig}
        />
      ) : (
        <View style={[S.centre, { height: chartH }]}>
          <Ionicons name="bar-chart-outline" size={40} color="#44445a" />
          <Text style={S.emptyTxt}>No market data available</Text>
        </View>
      )}
    </View>
  );

  const InfoBlock = (
    <View style={[S.infoContent, isLandscape && S.infoContentLs]}>
      {/* Stats grid */}
      <View style={[S.statsCard, isLandscape && S.statsCardLs]}>
        <View style={S.statsGrid}>
          <StatCell label="Open"       value={open      ? fmt(open)      : '—'} />
          <StatCell label="Prev Close" value={prevClose  ? fmt(prevClose) : '—'} />
          <StatCell label="Day High"   value={dayHigh   ? fmt(dayHigh)   : '—'} color={C.green} />
          <StatCell label="Day Low"    value={dayLow    ? fmt(dayLow)    : '—'} color={C.red}   />
          <StatCell label="Volume"     value={vol       ? vol.toLocaleString('en-IN') : '—'} />
          <StatCell label="Market Cap" value={mktCap    ? fmtCompact(mktCap) : '—'} />
        </View>
      </View>

      {/* Range bar */}
      {dayHigh > 0 && dayLow > 0 && (
        <View style={[S.rangeCard, isLandscape && S.rangeCardLs]}>
          <View style={S.rangeHeader}>
            <Text style={S.rangeLabel}>Day Range</Text>
            <Text style={S.rangeValues}>{fmt(dayLow)} – {fmt(dayHigh)}</Text>
          </View>
          <View style={S.rangeTrack}>
            <View style={[S.rangeFill, {
              backgroundColor: accent,
              width: `${Math.min(100, Math.max(0, ((last - dayLow) / (dayHigh - dayLow)) * 100))}%` as any,
            }]} />
            <View style={[S.rangeDot, {
              left: `${Math.min(98, Math.max(0, ((last - dayLow) / (dayHigh - dayLow)) * 100))}%` as any,
              backgroundColor: accent,
            }]} />
          </View>
          <View style={S.rangeEnds}>
            <Text style={S.rangeEnd}>{fmt(dayLow)}</Text>
            <Text style={S.rangeEnd}>{fmt(dayHigh)}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[S.root, {
        paddingTop:    insets.top,
        paddingBottom: insets.bottom,
        paddingLeft:   insets.left,
        paddingRight:  insets.right,
      }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* ── PORTRAIT HEADER ── */}
        {!isLandscape && (
          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={22} color={C.textPri} />
            </TouchableOpacity>
            <View style={S.headerMid}>
              <Text style={S.headerSym}>{sym}</Text>
              <View style={[S.badge, { backgroundColor: dimBg }]}>
                <Text style={[S.badgeTxt, { color: accent }]}>NSE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleLandscape} style={S.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="expand-outline" size={22} color={C.textPri} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── PORTRAIT PRICE ── */}
        {!isLandscape && (
          <View style={S.priceBlock}>
            <Text style={S.co} numberOfLines={1}>{stockMeta?.resolved_name || '—'}</Text>
            <Text style={S.price}>{stockMeta ? fmt(stockMeta.regularMarketPrice) : '—'}</Text>
            <View style={S.changeRow}>
              <View style={[S.changePill, { backgroundColor: dimBg }]}>
                <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={13} color={accent}
                  style={{ marginRight: 4 }} />
                <Text style={[S.changeAmt, { color: accent }]}>{isUp ? '+' : ''}{fmt(diff)}</Text>
              </View>
              <Text style={[S.changePct, { color: accent }]}>{isUp ? '+' : ''}{pct}%</Text>
              <Text style={S.changeRange}>· {activeRange.label}</Text>
            </View>
          </View>
        )}

        {/* ── LANDSCAPE TOP BAR ── */}
        {isLandscape && (
          <View style={S.lsBar}>
            <View style={S.lsLeft}>
              <TouchableOpacity onPress={() => router.back()} style={S.iconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="arrow-back" size={22} color={C.textPri} />
              </TouchableOpacity>
              <View>
                <Text style={S.lsSym}>{sym}</Text>
                {stockMeta?.resolved_name ? (
                  <Text style={S.lsName} numberOfLines={1}>{stockMeta.resolved_name}</Text>
                ) : null}
              </View>
            </View>
            <View style={S.lsRight}>
              {stockMeta && <Text style={S.lsPrice}>{fmt(stockMeta.regularMarketPrice)}</Text>}
              <View style={[S.changePill, { backgroundColor: dimBg }]}>
                <Text style={[S.changePct, { color: accent }]}>{isUp ? '+' : ''}{pct}%</Text>
              </View>
              <TouchableOpacity onPress={toggleLandscape} style={S.iconBtn}>
                <Ionicons name="contract-outline" size={20} color={C.textPri} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TIMEFRAME PILLS ── */}
        <View style={S.tfRow}>
          {TIMEFRAMES.map(tf => {
            const on = activeRange.label === tf.label;
            return (
              <TouchableOpacity key={tf.label}
                style={[S.pill, on && { backgroundColor: accent }]}
                onPress={() => setActiveRange(tf)} activeOpacity={0.7}>
                <Text style={[S.pillTxt, on && { color: C.bg }]}>{tf.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SCROLLABLE BODY — same pattern for both orientations ── */}
        <ScrollView
          style={S.scroll}
          contentContainerStyle={[
            S.scrollContent,
            // In landscape: lay chart + info side-by-side so user sees both
            // without scrolling too much
            isLandscape && S.scrollContentLs,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLandscape ? (
            // ── LANDSCAPE: chart left, info right, side-by-side ──────────────
            <View style={S.lsRow}>
              {/* Left: chart */}
              <View style={S.lsChartCol}>
                {ChartBlock}
              </View>
              {/* Right: info */}
              <View style={S.lsInfoCol}>
                {InfoBlock}
              </View>
            </View>
          ) : (
            // ── PORTRAIT: stacked ────────────────────────────────────────────
            <>
              {ChartBlock}
              {InfoBlock}
            </>
          )}
        </ScrollView>

        {/* ── BUY / SELL — always visible, outside scroll ── */}
        <View style={S.footer}>
          <TouchableOpacity style={[S.btn, S.sell]} activeOpacity={0.8}>
            <Text style={S.btnTxt}>SELL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.btn, S.buy]} activeOpacity={0.8}>
            <Text style={S.btnTxt}>BUY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // header (portrait)
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSym: { fontSize: 18, fontWeight: '800', color: C.textPri, letterSpacing: 0.4 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn:   { width: 36, height: 36, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  // price (portrait)
  priceBlock:  { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  co:          { fontSize: 12, color: C.textSec, fontWeight: '500', marginBottom: 2 },
  price:       { fontSize: 30, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
  changeRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  changePill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  changeAmt:   { fontSize: 12, fontWeight: '700' },
  changePct:   { fontSize: 12, fontWeight: '700' },
  changeRange: { fontSize: 11, color: C.textSec },

  // landscape header
  lsBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 6 },
  lsLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lsRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lsSym:   { fontSize: 15, fontWeight: '800', color: C.textPri },
  lsName:  { fontSize: 10, color: C.textSec, fontWeight: '500', maxWidth: 160 },
  lsPrice: { fontSize: 15, fontWeight: '700', color: C.textPri },

  // timeframe pills
  tfRow:   { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6 },
  pill:    { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.pill },
  pillTxt: { fontSize: 13, fontWeight: '700', color: C.axis },

  // scroll
  scroll:           { flex: 1 },
  scrollContent:    { paddingBottom: 8 },
  scrollContentLs:  { paddingBottom: 8 },

  // chart wrapper
  chartWrap: {},

  // landscape side-by-side layout
  lsRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  lsChartCol: { flex: 3 },   // chart gets 60% of width
  lsInfoCol:  { flex: 2, paddingTop: 4 },  // info gets 40% of width

  // states
  centre:   { alignItems: 'center', justifyContent: 'center' },
  loadTxt:  { color: C.textSec, fontSize: 13, marginTop: 10 },
  emptyTxt: { color: C.textSec, fontSize: 13, marginTop: 10 },

  // info section
  infoContent:   { paddingHorizontal: 16, paddingTop: 10 },
  infoContentLs: { paddingHorizontal: 8, paddingTop: 4 },

  statsCard:   { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  statsCardLs: { padding: 10 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  rangeCard:   { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  rangeCardLs: { padding: 10 },
  rangeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rangeLabel:  { fontSize: 11, color: C.textSec, fontWeight: '600' },
  rangeValues: { fontSize: 11, color: C.textPri, fontWeight: '600' },
  rangeTrack:  { height: 5, backgroundColor: C.border, borderRadius: 3, position: 'relative', marginBottom: 6 },
  rangeFill:   { height: 5, borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  rangeDot:    { width: 11, height: 11, borderRadius: 6, position: 'absolute', top: -3, marginLeft: -5, borderWidth: 2, borderColor: C.bg },
  rangeEnds:   { flexDirection: 'row', justifyContent: 'space-between' },
  rangeEnd:    { fontSize: 10, color: C.textSec, fontWeight: '600' },

  // footer
  footer:  { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 4 : 10, borderTopWidth: 1, borderTopColor: C.border },
  btn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sell:    { backgroundColor: C.red },
  buy:     { backgroundColor: C.green },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
});
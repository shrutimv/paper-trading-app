import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '../../src/config';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (val: number) => '₳' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (val: number): string => {
  if (val >= 10_000_000) return '₳' + (val / 10_000_000).toFixed(2) + ' Cr';
  if (val >= 100_000)    return '₳' + (val / 100_000).toFixed(2) + ' L';
  if (val >= 1_000)      return '₳' + (val / 1_000).toFixed(2) + ' K';
  return '₳' + val.toFixed(2);
};

const makeYLabel = (yOff: number) => (raw: string): string => {
  const n = parseFloat(raw) + yOff;
  if (isNaN(n) || n <= 0) return '';
  if (n >= 100_000) return (n / 100_000).toFixed(1) + 'L';
  if (n >= 1_000)   return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
};

// Safe date parser for the new Python format ("YYYY-MM-DD HH:MM:SS")
const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  // iOS Safari/JS needs the 'T' instead of space to parse reliably
  return new Date(dateStr.replace(' ', 'T')); 
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
  green:   '#089981', // TradingView Green
  greenBg: 'rgba(8,153,129,0.12)',
  red:     '#f23645', // TradingView Red
  redBg:   'rgba(242,54,69,0.12)',
  pill:    '#1e1e2c',
};

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

export default function StockDetailScreen() {
  const router            = useRouter();
  const { symbol }        = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const insets            = useSafeAreaInsets();

  const [activeRange, setActiveRange] = useState(TIMEFRAMES[3]);
  const [chartData,   setChartData]   = useState<any[]>([]);
  const [stockMeta,   setStockMeta]   = useState<any>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  const [sliderIndex, setSliderIndex] = useState(0);
  const isLandscape = width > height;

  useEffect(() => { fetchStockData(); }, [symbol, activeRange]);
  useEffect(() => () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); }, []);

  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/stock?symbol=${symbol}&period=${activeRange.period}&interval=${activeRange.interval}`);
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
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLandscape = async () => {
    await ScreenOrientation.lockAsync(
      isLandscape ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
    );
  };

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
  const yRange = (maxP - yOff) * 1.05;

  const Y_W  = 40; 
  const containerWidth = isLandscape ? width * 0.95 : width - 16; 
  const chartW = containerWidth - Y_W; 
  const chartH = isLandscape ? 220 : 250;

  const spacing = chartData.length > 1 ? chartW / (chartData.length - 1) : 2;
  const fmtY = useCallback(makeYLabel(yOff), [yOff]);

  const yLabelStyle = { color: '#8888aa', fontSize: 9, fontWeight: '600' as const };
  const xLabelStyle = { color: '#8888aa', fontSize: 9, fontWeight: '600' as const };

  const sym       = String(symbol).replace('.NS', '');
  const dayHigh   = stockMeta?.dayHigh   ?? stockMeta?.regularMarketDayHigh          ?? maxP;
  const dayLow    = stockMeta?.dayLow    ?? stockMeta?.regularMarketDayLow            ?? minP;
  const open      = stockMeta?.open      ?? stockMeta?.regularMarketOpen              ?? first;
  const prevClose = stockMeta?.previousClose ?? stockMeta?.regularMarketPreviousClose ?? 0;
  const vol       = stockMeta?.regularMarketVolume ?? 0;
  const mktCap    = stockMeta?.marketCap ?? 0;

  // CROSSHAIR & TOOLTIP MATH
  const selectedPoint = chartData[sliderIndex];
  let scrubDateText = '';
  let dotX = 0;
  let dotY = 0;
  let tooltipX = 0;
  
  if (selectedPoint) {
    const d = parseSafeDate(selectedPoint.fullDate);
    scrubDateText = activeRange.label === '1D' 
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      
    dotX = sliderIndex * spacing;
    dotY = chartH - ((selectedPoint.value - yOff) / yRange) * chartH;
    tooltipX = Math.max(0, Math.min(dotX - 50, chartW - 100));
  }

  const getXAxisLabels = () => {
    if (chartData.length === 0) return [];
    const steps = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * (chartData.length - 1)));
    return steps.map((idx) => {
      const p = chartData[idx];
      if (!p) return '';
      const d = parseSafeDate(p.fullDate);
      return activeRange.label === '1D'
        ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[S.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* ── HEADER (Hidden in Landscape to save space) ── */}
        {!isLandscape && (
          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={C.textPri} />
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
          contentContainerStyle={[S.scrollContent, { width: containerWidth, alignSelf: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          {/* PRICE BLOCK */}
          <View style={[S.priceBlock, isLandscape && { marginTop: 10 }]}>
            <Text style={S.co} numberOfLines={1}>{stockMeta?.resolved_name || '—'}</Text>
            <Text style={S.price}>{stockMeta ? fmt(stockMeta.regularMarketPrice) : '—'}</Text>
            <View style={S.changeRow}>
              <View style={[S.changePill, { backgroundColor: dimBg }]}>
                <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={13} color={accent} style={{ marginRight: 4 }} />
                <Text style={[S.changeAmt, { color: accent }]}>{isUp ? '+' : ''}{fmt(diff)}</Text>
              </View>
              <Text style={[S.changePct, { color: accent }]}>{isUp ? '+' : ''}{pct}%</Text>
              <Text style={S.changeRange}>· {activeRange.label}</Text>
            </View>
          </View>

          {/* TIMEFRAME PILLS */}
          <View style={S.tfRow}>
            {TIMEFRAMES.map(tf => {
              const on = activeRange.label === tf.label;
              return (
                <TouchableOpacity key={tf.label} style={[S.pill, on && { backgroundColor: accent }]} onPress={() => setActiveRange(tf)} activeOpacity={0.7}>
                  <Text style={[S.pillTxt, on && { color: C.bg }]}>{tf.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* THE CHART BLOCK */}
          <View style={S.chartWrap}>
            {isLoading ? (
              <View style={[S.centre, { height: chartH }]}>
                <ActivityIndicator size="large" color={accent} />
                <Text style={S.loadTxt}>Fetching market data…</Text>
              </View>
            ) : chartData.length > 0 ? (
              <View>
                
                <View style={{ position: 'relative' }}>
                  {/* FLOATING TOOLTIP ON CURVE */}
                  {selectedPoint && (
                    <View style={[S.floatingTooltip, { left: tooltipX, top: Math.max(dotY - 45, 0), borderColor: accent }]}>
                      <Text style={[S.scrubPrice, { color: accent }]}>{fmt(selectedPoint.value)}</Text>
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
                    thickness={2}
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
                    startOpacity={0.2}
                    endOpacity={0.0}
                  />

                  {/* DOT ON CURVE */}
                  {selectedPoint && (
                    <View style={[S.curveDot, { left: dotX - 6, top: dotY - 6, backgroundColor: accent }]} />
                  )}
                </View>

                {/* CUSTOM X-AXIS */}
                <View style={[S.customXAxis, { width: chartW }]}>
                  {getXAxisLabels().map((label, i) => (
                    <Text key={i} style={S.customXLabel}>{label}</Text>
                  ))}
                </View>

                {/* FAT TOUCH SLIDER */}
                <View style={S.sliderContainer}>
                  <Slider
                    style={{ width: chartW, height: 50, marginLeft: -15 }}
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
                <Ionicons name="bar-chart-outline" size={40} color="#44445a" />
                <Text style={S.emptyTxt}>No market data available</Text>
              </View>
            )}
          </View>

          {/* STATS BLOCK */}
          <View style={S.statsCard}>
            <View style={S.statsGrid}>
              <StatCell label="Open"       value={open      ? fmt(open)      : '—'} />
              <StatCell label="Prev Close" value={prevClose  ? fmt(prevClose) : '—'} />
              <StatCell label="Day High"   value={dayHigh   ? fmt(dayHigh)   : '—'} color={C.green} />
              <StatCell label="Day Low"    value={dayLow    ? fmt(dayLow)    : '—'} color={C.red}   />
              <StatCell label="Volume"     value={vol       ? vol.toLocaleString('en-IN') : '—'} />
              <StatCell label="Market Cap" value={mktCap    ? fmtCompact(mktCap) : '—'} />
            </View>
          </View>

        </ScrollView>

        {/* ── BUY / SELL ── */}
        {!isLandscape && (
          <View style={S.footer}>
            <TouchableOpacity style={[S.btn, S.sell]} activeOpacity={0.8}>
              <Text style={S.btnTxt}>SELL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.buy]} activeOpacity={0.8}>
              <Text style={S.btnTxt}>BUY</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerMid: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSym: { fontSize: 18, fontWeight: '800', color: C.textPri, letterSpacing: 0.4 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeTxt:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn:   { width: 36, height: 36, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  floatingExitBtn: { position: 'absolute', top: 20, right: 30, zIndex: 100, width: 40, height: 40, backgroundColor: 'rgba(26, 26, 38, 0.8)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  priceBlock:  { paddingTop: 4, paddingBottom: 8 },
  co:          { fontSize: 12, color: C.textSec, fontWeight: '500', marginBottom: 2 },
  price:       { fontSize: 30, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
  changeRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  changePill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  changeAmt:   { fontSize: 12, fontWeight: '700' },
  changePct:   { fontSize: 12, fontWeight: '700' },
  changeRange: { fontSize: 11, color: C.textSec },

  tfRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  pill:    { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: C.pill },
  pillTxt: { fontSize: 13, fontWeight: '700', color: C.axis },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  chartWrap: { paddingVertical: 10, marginBottom: 10 },
  
  customXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  customXLabel: { color: '#8888aa', fontSize: 9, fontWeight: '600' },

  floatingTooltip: { position: 'absolute', backgroundColor: '#1a1a26', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, zIndex: 30, alignItems: 'center', width: 100 },
  curveDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.bg, zIndex: 20 },
  scrubDate: { fontSize: 10, color: '#c0c0e0', fontWeight: '600', marginTop: 2 },
  scrubPrice: { fontSize: 13, fontWeight: '900' },
  
  sliderContainer: { marginTop: 15, paddingVertical: 5 },

  centre:   { alignItems: 'center', justifyContent: 'center' },
  loadTxt:  { color: C.textSec, fontSize: 13, marginTop: 10 },
  emptyTxt: { color: C.textSec, fontSize: 13, marginTop: 10 },

  statsCard:   { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  footer:  { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  btn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sell:    { backgroundColor: C.red },
  buy:     { backgroundColor: C.green },
  btnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
});
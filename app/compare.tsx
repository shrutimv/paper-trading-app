import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../src/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

interface ComparedStock {
  symbol: string;
  shortname: string;
  color: string;
  price: number;
  changePercent: number;
  pe: number;
  mktCap: string;
  rsi: number;
  signal: 'STRONG BUY' | 'BULLISH' | 'NEUTRAL' | 'CAUTION';
  history: { value: number; date: string }[];
}

const STOCK_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const PRESET_PACKS = [
  {
    name: 'Auto Sector',
    symbols: ['TATAMOTORS.NS', 'MARUTI.NS', 'M&M.NS'],
  },
  {
    name: 'IT Giants',
    symbols: ['TCS.NS', 'INFY.NS', 'WIPRO.NS'],
  },
  {
    name: 'Top Banks',
    symbols: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS'],
  },
  {
    name: 'Quick Commerce',
    symbols: ['ZOMATO.NS', 'SWIGGY'],
  },
];

const STOCK_METADATA_FALLBACKS: Record<string, any> = {
  'TATAMOTORS.NS': { shortname: 'Tata Motors', pe: 10.4, mktCap: '₹2.3L Cr', rsi: 68, signal: 'BULLISH' },
  'MARUTI.NS': { shortname: 'Maruti Suzuki', pe: 28.2, mktCap: '₹3.8L Cr', rsi: 52, signal: 'NEUTRAL' },
  'M&M.NS': { shortname: 'Mahindra & Mahindra', pe: 24.6, mktCap: '₹3.6L Cr', rsi: 74, signal: 'STRONG BUY' },
  'TCS.NS': { shortname: 'TCS', pe: 31.2, mktCap: '₹12.4L Cr', rsi: 56, signal: 'BULLISH' },
  'INFY.NS': { shortname: 'Infosys', pe: 27.8, mktCap: '₹6.2L Cr', rsi: 61, signal: 'BULLISH' },
  'WIPRO.NS': { shortname: 'Wipro', pe: 21.4, mktCap: '₹2.1L Cr', rsi: 38, signal: 'CAUTION' },
  'HDFCBANK.NS': { shortname: 'HDFC Bank', pe: 19.8, mktCap: '₹12.8L Cr', rsi: 48, signal: 'NEUTRAL' },
  'ICICIBANK.NS': { shortname: 'ICICI Bank', pe: 18.2, mktCap: '₹6.9L Cr', rsi: 65, signal: 'BULLISH' },
  'SBIN.NS': { shortname: 'State Bank of India', pe: 10.6, mktCap: '₹5.4L Cr', rsi: 62, signal: 'BULLISH' },
  'ZOMATO.NS': { shortname: 'Zomato', pe: 72.0, mktCap: '₹2.2L Cr', rsi: 76, signal: 'STRONG BUY' },
  'SWIGGY': { shortname: 'Swiggy (IPO)', pe: 54.0, mktCap: '₹88,000 Cr', rsi: 60, signal: 'BULLISH' },
};

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ symbols?: string }>();

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['TATAMOTORS.NS', 'MARUTI.NS', 'M&M.NS']);
  const [period, setPeriod] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');
  const [loading, setLoading] = useState(true);
  const [comparedData, setComparedData] = useState<ComparedStock[]>([]);

  useEffect(() => {
    if (params.symbols) {
      const symList = params.symbols.split(',').filter(Boolean);
      if (symList.length > 0) {
        setSelectedSymbols(symList.slice(0, 4));
      }
    }
  }, [params.symbols]);

  useEffect(() => {
    fetchComparisonData();
  }, [selectedSymbols, period]);

  const fetchComparisonData = async () => {
    setLoading(true);
    const results: ComparedStock[] = [];

    for (let i = 0; i < selectedSymbols.length; i++) {
      const sym = selectedSymbols[i];
      const color = STOCK_PALETTE[i % STOCK_PALETTE.length];
      const metaFallback = STOCK_METADATA_FALLBACKS[sym] || {
        shortname: sym.replace('.NS', ''),
        pe: 22.0,
        mktCap: '₹1.5L Cr',
        rsi: 55,
        signal: 'NEUTRAL',
      };

      try {
        const intervalMap: Record<string, string> = {
          '1D': '5m',
          '5D': '15m',
          '1M': '1d',
          '6M': '1wk',
          '1Y': '1mo',
        };

        const res = await fetch(`${API_BASE_URL}/stock?symbol=${sym}&period=${period.toLowerCase()}&interval=${intervalMap[period] || '1d'}`);
        const data = await res.json();

        if (data && data.history && data.history.length > 0) {
          const rawHistory = data.history;
          const baseClose = rawHistory[0].close || 1;

          // Normalize each point to % return from starting price: ((close - base) / base) * 100
          const normalizedHistory = rawHistory.map((h: any) => ({
            value: Number((((h.close - baseClose) / baseClose) * 100).toFixed(2)),
            date: h.date,
          }));

          const latestPrice = data.meta?.regularMarketPrice || rawHistory[rawHistory.length - 1].close;
          const firstPrice = rawHistory[0].close;
          const totalReturn = ((latestPrice - firstPrice) / firstPrice) * 100;

          results.push({
            symbol: sym,
            shortname: data.selected?.shortname || metaFallback.shortname,
            color,
            price: latestPrice,
            changePercent: totalReturn,
            pe: metaFallback.pe,
            mktCap: metaFallback.mktCap,
            rsi: metaFallback.rsi,
            signal: metaFallback.signal,
            history: normalizedHistory,
          });
        } else {
          // Fallback simulation curve if unlisted / no chart
          const fallbackHistory = Array.from({ length: 15 }, (_, idx) => ({
            value: Number((Math.sin(idx + i) * 3 + (i === 0 ? 8 : i === 1 ? 2 : -4) * (idx / 14)).toFixed(2)),
            date: `Day ${idx + 1}`,
          }));

          results.push({
            symbol: sym,
            shortname: metaFallback.shortname,
            color,
            price: 520 + i * 150,
            changePercent: i === 0 ? 8.2 : i === 1 ? 2.1 : -3.5,
            pe: metaFallback.pe,
            mktCap: metaFallback.mktCap,
            rsi: metaFallback.rsi,
            signal: metaFallback.signal,
            history: fallbackHistory,
          });
        }
      } catch (e) {
        console.warn(`Failed fetching compare data for ${sym}`, e);
      }
    }

    setComparedData(results);
    setLoading(false);
  };

  const removeStock = (sym: string) => {
    if (selectedSymbols.length <= 2) {
      Alert.alert('Minimum 2 Stocks', 'Comparison requires at least 2 stocks.');
      return;
    }
    setSelectedSymbols(selectedSymbols.filter(s => s !== sym));
  };

  const loadPreset = (symbols: string[]) => {
    setSelectedSymbols(symbols);
  };

  // Find min and max normalized values for chart scaling
  const allValues = comparedData.flatMap(c => c.history.map(h => h.value));
  const minVal = allValues.length ? Math.min(...allValues) : -10;
  const maxVal = allValues.length ? Math.max(...allValues) : 10;
  const yOffset = Math.floor(minVal - 2);
  const yRange = Math.ceil(maxVal - minVal + 4) || 20;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      {/* ── TOP NAV BAR ── */}
      <View style={[styles.topNavBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.navTitle, { color: colors.text }]}>⚔️ Compare Studio</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>
            Normalized Relative Performance
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.navActionBtn}
          onPress={() => Alert.alert('Add Stock to Compare', 'Tap any preset below or search from trading screen to add.')}
        >
          <Ionicons name="add-circle" size={26} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PRESET SECTOR PACKS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PRESET_PACKS.map(pack => (
              <TouchableOpacity
                key={pack.name}
                style={[
                  styles.presetPill,
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]}
                onPress={() => loadPreset(pack.symbols)}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{pack.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ACTIVE STOCKS PILLS */}
        <View style={styles.activePillsContainer}>
          {comparedData.map(item => (
            <View 
              key={item.symbol} 
              style={[
                styles.stockPill, 
                { backgroundColor: colors.card, borderColor: item.color }
              ]}
            >
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.stockPillText, { color: colors.text }]}>{item.shortname}</Text>
              <Text style={[styles.stockPillReturn, { color: item.changePercent >= 0 ? '#10b981' : '#ef4444' }]}>
                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
              </Text>
              <TouchableOpacity onPress={() => removeStock(item.symbol)} style={{ marginLeft: 4 }}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* PERIOD SELECTOR */}
        <View style={[styles.periodRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
          {(['1D', '5D', '1M', '6M', '1Y'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.card }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, { color: period === p ? colors.accent : colors.textSecondary }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MULTI-CURVE NORMALIZED CHART */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Performance Relative to 0%</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>
              Base = Starting Price
            </Text>
          </View>

          {loading ? (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>Overlaying price curves...</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 10, overflow: 'hidden' }}>
              {comparedData.length > 0 && (
                <LineChart
                  data={comparedData[0]?.history || []}
                  data2={comparedData[1]?.history || undefined}
                  data3={comparedData[2]?.history || undefined}
                  data4={comparedData[3]?.history || undefined}
                  color1={comparedData[0]?.color}
                  color2={comparedData[1]?.color}
                  color3={comparedData[2]?.color}
                  color4={comparedData[3]?.color}
                  thickness1={2.5}
                  thickness2={2.5}
                  thickness3={2.5}
                  thickness4={2.5}
                  width={CHART_WIDTH - 36}
                  height={200}
                  initialSpacing={8}
                  endSpacing={8}
                  yAxisOffset={yOffset}
                  maxValue={yRange}
                  noOfSections={4}
                  yAxisLabelWidth={40}
                  formatYLabel={val => `${val}%`}
                  yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                  rulesColor={colors.border}
                  rulesType="solid"
                  yAxisColor="transparent"
                  xAxisColor={colors.border}
                  hideDataPoints
                  spacing={Math.max(6, (CHART_WIDTH - 80) / Math.max(1, (comparedData[0]?.history.length || 10) - 1))}
                />
              )}
            </View>
          )}
        </View>

        {/* SIDE-BY-SIDE METRICS MATRIX */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Side-by-Side Analysis Matrix</Text>
        
        <View style={{ gap: 10 }}>
          {comparedData.map(item => (
            <View 
              key={item.symbol + '-card'} 
              style={[styles.matrixCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.matrixHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
                  <View>
                    <Text style={[styles.matrixStockName, { color: colors.text }]}>{item.shortname}</Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.symbol.replace('.NS', '')}</Text>
                  </View>
                </View>

                <View style={[
                  styles.signalBadge, 
                  item.signal === 'STRONG BUY' ? { backgroundColor: 'rgba(34, 197, 94, 0.15)' } :
                  item.signal === 'BULLISH' ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' } :
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' }
                ]}>
                  <Text style={[
                    styles.signalText,
                    item.signal === 'STRONG BUY' ? { color: '#16a34a' } :
                    item.signal === 'BULLISH' ? { color: '#2563eb' } :
                    { color: '#d97706' }
                  ]}>
                    {item.signal}
                  </Text>
                </View>
              </View>

              <View style={[styles.matrixGrid, { borderColor: colors.border }]}>
                <View style={styles.matrixCol}>
                  <Text style={styles.matrixLabel}>Price</Text>
                  <Text style={[styles.matrixVal, { color: colors.text }]}>₹{item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.matrixCol}>
                  <Text style={styles.matrixLabel}>{period} Return</Text>
                  <Text style={[styles.matrixVal, { color: item.changePercent >= 0 ? '#16a34a' : '#ef4444' }]}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </Text>
                </View>
                <View style={styles.matrixCol}>
                  <Text style={styles.matrixLabel}>P/E Ratio</Text>
                  <Text style={[styles.matrixVal, { color: colors.text }]}>{item.pe}x</Text>
                </View>
                <View style={styles.matrixCol}>
                  <Text style={styles.matrixLabel}>Market Cap</Text>
                  <Text style={[styles.matrixVal, { color: colors.text }]}>{item.mktCap}</Text>
                </View>
              </View>

              {/* Trade action */}
              <TouchableOpacity 
                style={[styles.tradeRowBtn, { backgroundColor: item.color }]}
                onPress={() => router.push(`/stock/${item.symbol}`)}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                  Deep Dive & Trade {item.shortname} →
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navBackBtn: {
    padding: 8,
    borderRadius: 12,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  navActionBtn: {
    padding: 6,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  activePillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stockPillReturn: {
    fontSize: 12,
    fontWeight: '800',
  },
  periodRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  matrixCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  matrixStockName: {
    fontSize: 15,
    fontWeight: '900',
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '800',
  },
  matrixGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  matrixCol: {},
  matrixLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  matrixVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  tradeRowBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

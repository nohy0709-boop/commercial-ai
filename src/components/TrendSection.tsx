import { COLORS } from '@/constants/colors';
import {
    addMonths,
    aggregateTrend,
    fetchMonthlyRows,
    getCadence,
    getMonthRange,
    monthText,
    type Granularity,
    type MonthlyRow,
    type TrendPoint,
} from '@/services/trendData';

import { useEffect, useMemo, useState } from 'react';

import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

type Props = {
  /** 분석 대상 지역(행정동) 이름 */
  areaName: string;
  /** 분석 업종 이름 */
  businessName: string;
};

type Preset = '6m' | '1y' | 'all' | 'custom';
type Metric = 'count' | 'rate' | 'flow';

const GRANULARITIES: { key: Granularity; label: string; unit: string }[] = [
  { key: 'month', label: '월별', unit: '월' },
  { key: 'quarter', label: '분기별', unit: '분기' },
  { key: 'year', label: '연도별', unit: '연' },
];

const PRESETS: { key: Preset; label: string }[] = [
  { key: '6m', label: '최근 6개월' },
  { key: '1y', label: '최근 1년' },
  { key: 'all', label: '전체' },
  { key: 'custom', label: '직접 선택' },
];

const METRICS: { key: Metric; label: string }[] = [
  { key: 'count', label: '점포 수' },
  { key: 'rate', label: '개업·폐업률' },
  { key: 'flow', label: '개업·폐업 수' },
];

const OPEN_COLOR = COLORS.primary;
const CLOSE_COLOR = COLORS.danger;

/* ---------------- 그래프 ---------------- */

type Series = { name: string; color: string; values: number[] };

function TrendChart({
  points,
  series,
  unit,
}: {
  points: TrendPoint[];
  series: Series[];
  unit: string;
}) {
  const W = 320;
  const H = 190;
  const padLeft = 38;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 28;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const all = series.flatMap(s => s.values);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);

  // 점포 수는 변화가 잘 보이게 아래쪽을 잘라서, 나머지(률·건수)는 0부터 시작
  const startsAtZero = unit !== '개';
  const span = Math.max(rawMax - rawMin, 1);
  const yMin = startsAtZero ? 0 : Math.max(0, rawMin - span * 0.2);
  const yMax = startsAtZero
    ? Math.max(rawMax * 1.15, 1)
    : rawMax + span * 0.2;

  const xFor = (i: number) =>
    points.length > 1
      ? padLeft + (i / (points.length - 1)) * plotW
      : padLeft + plotW / 2;

  const yFor = (v: number) =>
    padTop + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const ticks = [0, 0.5, 1].map(t => yMin + (yMax - yMin) * t);

  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  const formatTick = (v: number) =>
    unit === '%' ? `${v.toFixed(1)}` : `${Math.round(v)}`;

  return (
    <Svg width="100%" height={200} viewBox={`0 0 ${W} ${H}`}>
      {ticks.map((t, i) => (
        <Line
          key={`g-${i}`}
          x1={padLeft}
          x2={W - padRight}
          y1={yFor(t)}
          y2={yFor(t)}
          stroke="#E5E7EB"
          strokeWidth={1}
        />
      ))}

      {ticks.map((t, i) => (
        <SvgText
          key={`t-${i}`}
          x={padLeft - 6}
          y={yFor(t) + 3}
          fontSize="9"
          fill="#6B7280"
          textAnchor="end"
        >
          {formatTick(t)}
        </SvgText>
      ))}

      {series.map(s => (
        <Polyline
          key={s.name}
          points={s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
        />
      ))}

      {series.map(s =>
        s.values.map((v, i) => (
          <Circle
            key={`${s.name}-${i}`}
            cx={xFor(i)}
            cy={yFor(v)}
            r={points.length > 24 ? 1.5 : 3}
            fill={s.color}
          />
        )),
      )}

      {points.map((p, i) =>
        i % labelStep === 0 || i === points.length - 1 ? (
          <SvgText
            key={`x-${p.key}`}
            x={xFor(i)}
            y={H - 8}
            fontSize="9"
            fill="#6B7280"
            textAnchor="middle"
          >
            {p.label}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

/* ---------------- 본체 ---------------- */

export default function TrendSection({ areaName, businessName }: Props) {
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [granularity, setGranularity] = useState<Granularity>('month');
  const [preset, setPreset] = useState<Preset>('1y');
  const [metric, setMetric] = useState<Metric>('rate');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setFailed(false);

        const result = await fetchMonthlyRows(areaName, businessName);
        if (cancelled) {
          return;
        }

        setRows(result.rows);
        setIsSample(result.isSample);

        const range = getMonthRange(result.rows);
        if (range) {
          setCustomFrom(addMonths(range.maxMonth, -11) < range.minMonth
            ? range.minMonth
            : addMonths(range.maxMonth, -11));
          setCustomTo(range.maxMonth);
        }

        // 데이터가 분기 단위뿐이면 월별은 선택할 수 없으니 분기로 시작
        const cadence = getCadence(result.rows);
        setGranularity(cadence >= 12 ? 'year' : cadence >= 3 ? 'quarter' : 'month');
      } catch (error) {
        console.error('상권 추이 조회 실패:', error);
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [areaName, businessName]);

  const range = useMemo(() => getMonthRange(rows), [rows]);
  const cadence = useMemo(() => getCadence(rows), [rows]);

  const { fromMonth, toMonth } = useMemo(() => {
    if (!range) {
      return { fromMonth: '', toMonth: '' };
    }

    const clamp = (m: string) =>
      m < range.minMonth ? range.minMonth : m > range.maxMonth ? range.maxMonth : m;

    if (preset === 'all') {
      return { fromMonth: range.minMonth, toMonth: range.maxMonth };
    }
    if (preset === '6m') {
      return { fromMonth: clamp(addMonths(range.maxMonth, -5)), toMonth: range.maxMonth };
    }
    if (preset === '1y') {
      return { fromMonth: clamp(addMonths(range.maxMonth, -11)), toMonth: range.maxMonth };
    }

    const from = clamp(customFrom || range.minMonth);
    const to = clamp(customTo || range.maxMonth);
    return from <= to
      ? { fromMonth: from, toMonth: to }
      : { fromMonth: to, toMonth: from };
  }, [range, preset, customFrom, customTo]);

  const points = useMemo(
    () => (range ? aggregateTrend(rows, granularity, fromMonth, toMonth) : []),
    [rows, granularity, fromMonth, toMonth, range],
  );

  const granularityUnit =
    GRANULARITIES.find(g => g.key === granularity)?.unit ?? '월';

  const isGranularityDisabled = (g: Granularity) =>
    (g === 'month' && cadence > 1) || (g === 'quarter' && cadence > 3);

  const shiftCustom = (target: 'from' | 'to', diff: number) => {
    if (!range) {
      return;
    }

    const clamp = (m: string) =>
      m < range.minMonth ? range.minMonth : m > range.maxMonth ? range.maxMonth : m;

    if (target === 'from') {
      const next = clamp(addMonths(customFrom || range.minMonth, diff));
      setCustomFrom(next);
      if (next > (customTo || range.maxMonth)) {
        setCustomTo(next);
      }
    } else {
      const next = clamp(addMonths(customTo || range.maxMonth, diff));
      setCustomTo(next);
      if (next < (customFrom || range.minMonth)) {
        setCustomFrom(next);
      }
    }
  };

  /* ----- 요약 ----- */
  const summary = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const avg = (pick: (p: TrendPoint) => number) =>
      points.reduce((sum, p) => sum + pick(p), 0) / points.length;

    return {
      firstCount: first.storeCount,
      lastCount: last.storeCount,
      diff: last.storeCount - first.storeCount,
      avgOpen: avg(p => p.openRate),
      avgClose: avg(p => p.closeRate),
      totalOpen: points.reduce((s, p) => s + p.openCount, 0),
      totalClose: points.reduce((s, p) => s + p.closeCount, 0),
    };
  }, [points]);

  const series: Series[] = useMemo(() => {
    if (metric === 'count') {
      return [
        { name: '점포 수', color: COLORS.primary, values: points.map(p => p.storeCount) },
      ];
    }
    if (metric === 'rate') {
      return [
        { name: '개업률', color: OPEN_COLOR, values: points.map(p => p.openRate) },
        { name: '폐업률', color: CLOSE_COLOR, values: points.map(p => p.closeRate) },
      ];
    }
    return [
      { name: '개업', color: OPEN_COLOR, values: points.map(p => p.openCount) },
      { name: '폐업', color: CLOSE_COLOR, values: points.map(p => p.closeCount) },
    ];
  }, [metric, points]);

  const chartUnit = metric === 'count' ? '개' : metric === 'rate' ? '%' : '건';

  const insight = useMemo(() => {
    if (!summary) {
      return '';
    }
    if (summary.totalOpen === 0 && summary.totalClose === 0) {
      return '이 기간에는 개업·폐업 변화가 거의 없었어요.';
    }
    if (summary.totalOpen > summary.totalClose) {
      return `개업이 폐업보다 ${summary.totalOpen - summary.totalClose}곳 많아 점포가 늘어난 흐름이에요.`;
    }
    if (summary.totalOpen < summary.totalClose) {
      return `폐업이 개업보다 ${summary.totalClose - summary.totalOpen}곳 많아 점포가 줄어든 흐름이에요.`;
    }
    return '개업과 폐업이 비슷해서 점포 수가 안정적이에요.';
  }, [summary]);

  /* ----- 렌더 ----- */

  return (
    <View style={styles.box}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>상권 변화 추이</Text>
        {isSample ? (
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>샘플 데이터</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.description}>
        {areaName} · {businessName}의 점포 수와 개업·폐업 흐름을 기간별로 볼 수 있어요.
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : failed ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>추이 데이터를 불러오지 못했어요.</Text>
        </View>
      ) : !range ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            이 지역·업종의 추이 데이터가 아직 준비되지 않았어요.
          </Text>
        </View>
      ) : (
        <>
          {/* 단위 */}
          <Text style={styles.label}>보기 단위</Text>
          <View style={styles.row}>
            {GRANULARITIES.map(g => {
              const active = granularity === g.key;
              const disabled = isGranularityDisabled(g.key);

              return (
                <TouchableOpacity
                  key={g.key}
                  disabled={disabled}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    disabled && styles.chipDisabled,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setGranularity(g.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                      disabled && styles.chipTextDisabled,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {cadence > 1 ? (
            <Text style={styles.hint}>
              현재 데이터는 {cadence}개월 간격이라 더 촘촘한 단위는 선택할 수 없어요.
            </Text>
          ) : null}

          {/* 기간 */}
          <Text style={styles.label}>기간</Text>
          <View style={styles.rowWrap}>
            {PRESETS.map(p => {
              const active = preset === p.key;

              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.7}
                  onPress={() => setPreset(p.key)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {preset === 'custom' ? (
            <View style={styles.customBox}>
              {(['from', 'to'] as const).map(target => {
                const value =
                  target === 'from' ? fromMonth : toMonth;

                return (
                  <View key={target} style={styles.stepperRow}>
                    <Text style={styles.stepperLabel}>
                      {target === 'from' ? '시작' : '끝'}
                    </Text>

                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => shiftCustom(target, -1)}
                    >
                      <Text style={styles.stepperButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepperValue}>{monthText(value)}</Text>

                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => shiftCustom(target, 1)}
                    >
                      <Text style={styles.stepperButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.rangeText}>
              {monthText(fromMonth)} ~ {monthText(toMonth)}
            </Text>
          )}

          {/* 지표 */}
          <View style={styles.metricRow}>
            {METRICS.map(m => {
              const active = metric === m.key;

              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.metricTab, active && styles.metricTabActive]}
                  activeOpacity={0.7}
                  onPress={() => setMetric(m.key)}
                >
                  <Text
                    style={[styles.metricTabText, active && styles.metricTabTextActive]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {points.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>선택한 기간에 데이터가 없어요.</Text>
            </View>
          ) : (
            <>
              {series.length > 1 ? (
                <View style={styles.legendRow}>
                  {series.map(s => (
                    <View key={s.name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={styles.legendText}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.unitText}>단위: {chartUnit}</Text>

              <TrendChart points={points} series={series} unit={chartUnit} />

              {summary ? (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>점포 수 변화</Text>
                      <Text style={styles.summaryValue}>
                        {summary.firstCount} → {summary.lastCount}
                      </Text>
                      <Text
                        style={[
                          styles.summarySub,
                          { color: summary.diff >= 0 ? OPEN_COLOR : CLOSE_COLOR },
                        ]}
                      >
                        {summary.diff > 0 ? '+' : ''}
                        {summary.diff}곳
                      </Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>평균 개업률</Text>
                      <Text style={[styles.summaryValue, { color: OPEN_COLOR }]}>
                        {summary.avgOpen.toFixed(1)}%
                      </Text>
                      <Text style={styles.summarySub}>{granularityUnit}당</Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>평균 폐업률</Text>
                      <Text style={[styles.summaryValue, { color: CLOSE_COLOR }]}>
                        {summary.avgClose.toFixed(1)}%
                      </Text>
                      <Text style={styles.summarySub}>{granularityUnit}당</Text>
                    </View>
                  </View>

                  <View style={styles.insightBox}>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.toggleButton}
                activeOpacity={0.7}
                onPress={() => setShowTable(prev => !prev)}
              >
                <Text style={styles.toggleText}>
                  {showTable ? '숫자 표 접기 ▲' : '숫자 표로 보기 ▼'}
                </Text>
              </TouchableOpacity>

              {showTable ? (
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHead]}>
                    <Text style={[styles.cell, styles.cellFirst, styles.headText]}>기간</Text>
                    <Text style={[styles.cell, styles.headText]}>점포</Text>
                    <Text style={[styles.cell, styles.headText]}>개업</Text>
                    <Text style={[styles.cell, styles.headText]}>폐업</Text>
                  </View>

                  {points.map(p => (
                    <View key={p.key} style={styles.tableRow}>
                      <Text style={[styles.cell, styles.cellFirst]}>{p.label}</Text>
                      <Text style={styles.cell}>{p.storeCount}</Text>
                      <Text style={[styles.cell, { color: OPEN_COLOR }]}>
                        {p.openCount} ({p.openRate}%)
                      </Text>
                      <Text style={[styles.cell, { color: CLOSE_COLOR }]}>
                        {p.closeCount} ({p.closeRate}%)
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.footnote}>
                개업·폐업은 상가 데이터에서 점포가 새로 생기거나 사라진 것을 비교한 추정치예요.
                양도·이전·업종 변경은 개업과 폐업으로 함께 잡힐 수 있어요.
                개업률·폐업률은 기간 시작 시점의 점포 수 대비 비율이에요.
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  sampleBadge: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  sampleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.warning,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  center: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextDisabled: {
    color: COLORS.textSecondary,
  },
  rangeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  customBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperLabel: {
    width: 36,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    padding: 3,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricTabActive: {
    backgroundColor: COLORS.surface,
  },
  metricTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  metricTabTextActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  summaryItem: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  summarySub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  insightBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  toggleButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  table: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tableHead: {
    backgroundColor: COLORS.background,
  },
  headText: {
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  cell: {
    flex: 1.2,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'right',
  },
  cellFirst: {
    flex: 0.8,
    textAlign: 'left',
    fontWeight: '700',
  },
  footnote: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textSecondary,
  },
});
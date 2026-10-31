import { GlossaryProvider } from '@/components/Term';
import { COLORS } from '@/constants/colors';
import {
  addMonths,
  aggregateTrend,
  fetchMonthlyRows,
  getMonthRange,
  getSnapshotMonths,
  monthText,
  summarizeTrend,
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
  { key: 'month', label: '기준 시점별', unit: '시점' },
  { key: 'year', label: '연도별', unit: '연' },
];

const PRESETS: { key: Preset; label: string }[] = [
  { key: '6m', label: '6개월' },
  { key: '1y', label: '1년' },
  { key: 'all', label: '전체' },
  { key: 'custom', label: '직접 선택' },
];

const METRICS: { key: Metric; label: string }[] = [
  { key: 'count', label: '점포 수' },
  { key: 'rate', label: '개업·폐업률(추정)' },
  { key: 'flow', label: '개업·폐업 수(추정)' },
];


const OPEN_COLOR = '#1D2545';
const CLOSE_COLOR = '#EF302B';


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
  const [chartWidth, setChartWidth] = useState(320);
  const W = Math.max(240, chartWidth);
  const H = 230;
  const padLeft = 38;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 28;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const finiteValues = series.flatMap(s => s.values).filter(Number.isFinite);
  const all = finiteValues.length ? finiteValues : [0];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);

  // 점포 수는 변화가 잘 보이게 아래쪽을 잘라서, 나머지(률·건수)는 0부터 시작
  const startsAtZero = unit !== '개';
  const span = Math.max(rawMax - rawMin, 1);
  const yMin = startsAtZero ? 0 : Math.floor(Math.max(0, rawMin - span * 0.2));
  const yMax = startsAtZero
    ? Math.max(rawMax * 1.15, 1)
    : yMin + Math.max(1, Math.ceil((rawMax + span * 0.2 - yMin) / 2)) * 2;

  const timeIndex = (month: string) => {
    const [y, m] = month.split('-').map(Number); return y * 12 + m - 1;
  };
  const times = points.map(p => timeIndex(p.toMonth));
  const timeSpan = times.length > 1 ? times[times.length - 1] - times[0] : 0;
  const xFor = (i: number) => timeSpan > 0
    ? padLeft + ((times[i] - times[0]) / timeSpan) * plotW
    : padLeft + plotW / 2;

  const yFor = (v: number) =>
    padTop + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const ticks = [0, 0.5, 1].map(t => yMin + (yMax - yMin) * t);

  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  const formatTick = (v: number) =>
    unit === '%' ? `${v.toFixed(1)}` : `${Math.round(v)}`;

  return (
    <View
      style={{ width: '100%', height: 240 }}
      onLayout={event => setChartWidth(event.nativeEvent.layout.width)}
    >
    <Svg width="100%" height={240} viewBox={`0 0 ${W} ${H}`}>

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

      {series.map(s => {
        const segments: string[][] = [];
        let segment: string[] = [];
        s.values.forEach((value, index) => {
          if (Number.isFinite(value)) {
            segment.push(`${xFor(index)},${yFor(value)}`);
          } else if (segment.length) {
            segments.push(segment);
            segment = [];
          }
        });
        if (segment.length) segments.push(segment);
        return segments.map((vertices, index) => vertices.length > 1 ? (
          <Polyline
            key={`${s.name}-line-${index}`}
            points={vertices.join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ) : null);
      })}

      {series.map(s => s.values.map((value, index) => Number.isFinite(value) ? (
        <Circle
          key={`${s.name}-${index}`}
          cx={xFor(index)}
          cy={yFor(value)}
          r={points.length > 24 ? 1.5 : 3}
          fill={s.color}
        />
      ) : null))}

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
    </View>
  );
}

/* ---------------- 본체 ---------------- */

export default function TrendSection({ areaName, businessName }: Props) {
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [matchedBusiness, setMatchedBusiness] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [granularity, setGranularity] = useState<Granularity>('month');
  const [preset, setPreset] = useState<Preset>('1y');
  const [metric, setMetric] = useState<Metric>('count');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setFailed(false);
        setRows([]);
        setIsSample(false);

        const result = await fetchMonthlyRows(areaName, businessName);
        if (cancelled) {
          return;
        }

        setRows(result.rows);
        setIsSample(result.isSample);
        setMatchedBusiness(result.matchedBusiness);

        const range = getMonthRange(result.rows);
        if (range) {
          const months = getSnapshotMonths(result.rows);
          const target = addMonths(range.maxMonth, -12);
          setCustomFrom([...months].reverse().find(m => m <= target) ?? range.minMonth);
          setCustomTo(range.maxMonth);
        }
        setGranularity('month');
        setPreset('1y');

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
  const months = useMemo(() => getSnapshotMonths(rows), [rows]);

  const { fromMonth, toMonth } = useMemo(() => {
    if (!range) {
      return { fromMonth: '', toMonth: '' };
    }

    const snap = (target: string) =>
      [...months].reverse().find(m => m <= target) ?? range.minMonth;
    if (preset === 'all') return { fromMonth: range.minMonth, toMonth: range.maxMonth };
    if (preset === '6m' || preset === '1y') {
      return { fromMonth: snap(addMonths(range.maxMonth, preset === '6m' ? -6 : -12)), toMonth: range.maxMonth };
    }
    const from = months.includes(customFrom) ? customFrom : range.minMonth;
    const to = months.includes(customTo) ? customTo : range.maxMonth;
    return from < to ? { fromMonth: from, toMonth: to }
      : { fromMonth: range.minMonth, toMonth: range.maxMonth };
  }, [range, months, preset, customFrom, customTo]);

  const points = useMemo(
    () => range
      ? aggregateTrend(rows, granularity, fromMonth, toMonth)
          .filter(point => point.toMonth >= '2023-01')
      : [],
    [rows, granularity, fromMonth, toMonth, range],
  );
  const isGranularityDisabled = (g: Granularity) => g === 'quarter';
  const shiftCustom = (target: 'from' | 'to', diff: number) => {
    const current = target === 'from' ? fromMonth : toMonth;
    const next = months[months.indexOf(current) + diff];
    if (!next) return;
    if (target === 'from' && next < toMonth) setCustomFrom(next);
    if (target === 'to' && next > fromMonth) setCustomTo(next);
  };
  const selectPreset = (value: Preset) => {
    if (value === 'custom') { setCustomFrom(fromMonth); setCustomTo(toMonth); }
    setPreset(value);
  };

  /* ----- 요약: 그래프 보기 단위와 분리 ----- */
  const summary = useMemo(
    () => summarizeTrend(rows, fromMonth, toMonth),
    [rows, fromMonth, toMonth],
  );

  const formatRate = (rate: number | null) =>
    rate !== null && Number.isFinite(rate) ? `${rate.toFixed(1)}%` : '산출 불가';

  const series: Series[] = useMemo(() => {
    if (metric === 'count') {
      return [
        { name: '점포 수', color: COLORS.primary, values: points.map(p => p.storeCount) },
      ];
    }
    if (metric === 'rate') {
      return [
        { name: '개업률(추정)', color: OPEN_COLOR, values: points.map(p => p.openRate) },
        { name: '폐업률(추정)', color: CLOSE_COLOR, values: points.map(p => p.closeRate) },
      ];
    }
    return [
      { name: '개업(추정)', color: OPEN_COLOR, values: points.map(p => p.openCount) },
      { name: '폐업(추정)', color: CLOSE_COLOR, values: points.map(p => p.closeCount) },
    ];
  }, [metric, points]);

  const chartUnit = metric === 'count' ? '개' : metric === 'rate' ? '%' : '건';

  const insight = useMemo(() => {
    if (!summary) return '';
    if (!summary.coverageComplete) return '연속된 원본 집계를 확인할 수 없어 기간 비율을 표시하지 않아요.';
    const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`;
    return `개업 추정 ${summary.totalOpen}곳, 폐업 추정 ${summary.totalClose}곳이에요. ` +
      `계속 관측된 업소의 지역·업종 그룹 진입 ${summary.transferIn}곳, 이탈 ${summary.transferOut}곳을 포함해 ` +
      `점포 수는 ${signed(summary.diff)}곳 변했어요.` +
      (summary.reconciliationDifference ? ' 집계 불일치가 있어 원본 확인이 필요해요.' : '');
  }, [summary]);

  /* ----- 렌더 ----- */

  return (
    <GlossaryProvider>
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
          {areaName} · {businessName}의 점포 수와 개업·폐업 추이를 볼 수 있어요. 개업·폐업 수와 비율은 추정치예요.
        </Text>

        {matchedBusiness && matchedBusiness !== businessName && !loading ? (
          <Text style={styles.hint}>집계에 사용한 공식 업종: {matchedBusiness}</Text>
        ) : null}
        {isSample && !loading ? (
          <Text style={styles.hint}>
            화면 확인용으로 생성한 가상 데이터입니다. 실제 지역·업종의 상권 판단에 사용할 수 없어요.
          </Text>
        ) : null}

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
              이 지역·업종의 데이터가 없거나 업종명이 일치하지 않아요. 업로드와 business_catalog.csv의 업종명을 확인해주세요.
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

            <Text style={styles.hint}>
              월별 자료가 아니에요. 파일명 기준 관측 시점 사이를 비교하며, 2025년 6→10월은 4개월, 10→12월은 2개월이에요.
            </Text>

            {/* 기간 */}
            <Text style={styles.label}>기간</Text>
            <Text style={styles.rangeText}>
              데이터 기준: {monthText(range.maxMonth)}
            </Text>
            <View style={styles.rowWrap}>
              {PRESETS.map(p => {
                const active = preset === p.key;

                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.7}
                    onPress={() => selectPreset(p.key)}
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

            <Text style={styles.hint}>
              시작·끝은 실제 관측 시점이에요. 시작 시점 이후부터 끝 시점까지의 변화를 합산해요. 6개월·1년은 데이터 기준 시점에서 거슬러 계산하며, 관측 시점에 맞춘 실제 범위가 위에 표시돼요. 비율은 각 구간 누적값으로, 간격이 다르면 단순 비교에 주의해주세요.
            </Text>

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

                {points.length === 1 ? (
                  <Text style={styles.hint}>
                    선택한 보기 단위에서 집계 구간이 1개라 점으로 표시돼요. 변화 추이를 보려면 더 긴 기간이나 더 촘촘한 단위를 선택해주세요.
                  </Text>
                ) : null}
                {metric === 'count' ? (
                  <Text style={styles.hint}>점포 수 그래프의 세로축은 변화가 보이도록 0보다 큰 값에서 시작할 수 있어요.</Text>
                ) : null}

                {summary ? (
                  <>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>기초 → 기말 점포 수</Text>
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
                        <Text style={styles.summaryLabel}>
                          기간 개업률(추정)
                        </Text>
                        <Text style={[styles.summaryValue, { color: OPEN_COLOR }]}>
                          {formatRate(summary.openRate)}
                        </Text>
                        <Text style={styles.summarySub}>선택 기간 누적</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                          기간 폐업률(추정)
                        </Text>
                        <Text style={[styles.summaryValue, { color: CLOSE_COLOR }]}>
                          {formatRate(summary.closeRate)}
                        </Text>
                        <Text style={styles.summarySub}>선택 기간 누적</Text>
                      </View>
                    </View>

                    {summary.inferredBase ? (
                      <Text style={styles.hint}>기초 점포 수는 직전 스냅샷이 없어 개업·폐업 집계로 역산한 값이에요.</Text>
                    ) : null}
                    {!summary.coverageComplete ? (
                      <Text style={styles.hint}>
                        원본 집계 범위: {monthText(summary.fromMonth)} ~ {monthText(summary.toMonth)}. 원본 구간을 월별로 임의 분할하거나 누락 구간을 0으로 채우지 않아요.
                      </Text>
                    ) : null}
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
                      <Text style={[styles.cell, styles.headText]}>개업(추정)</Text>
                      <Text style={[styles.cell, styles.headText]}>폐업(추정)</Text>
                    </View>

                    {points.map(p => (
                      <View key={p.key} style={styles.tableRow}>
                        <Text style={[styles.cell, styles.cellFirst]}>{p.label}{"\n"}<Text style={styles.summarySub}>{monthText(p.fromMonth)} ~ {monthText(p.toMonth)}</Text></Text>
                        <Text style={styles.cell}>{p.storeCount}</Text>
                        <Text style={[styles.cell, { color: OPEN_COLOR }]}>
                          {Number.isFinite(p.openCount) ? p.openCount : '—'} ({formatRate(p.openRate)})
                        </Text>
                        <Text style={[styles.cell, { color: CLOSE_COLOR }]}>
                          {Number.isFinite(p.closeCount) ? p.closeCount : '—'} ({formatRate(p.closeRate)})
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.footnote}>
                  개업·폐업은 시점별 세종 상가 목록의 신규 등장·소멸을 비교한 추정치이며, 실제 신고 통계와 다를 수 있어요.
                  수집 범위·자료 정비·업소번호 변경도 영향을 줄 수 있어요. 계속 관측된 업소의 행정동·업종 그룹 이동은 별도로 집계해요.
                  개업률·폐업률(추정)은 각 구간 합계 ÷ 시작 점포 수 × 100이에요. 시작 점포 수가 0이면 비율을 계산하지 않아요.
                  그래프는 2023년부터 표시해요. 2022년 12월 자료는 2023년 첫 구간의 계산 기준으로만 사용해요. 선택 시작 시점의 이전 변화는 합산하지 않아요. 2025-10은 파일명 기준으로 유지했고 9월로 바꾸지 않았어요.
                </Text>
              </>
            )}
          </>
        )}
      </View>
    </GlossaryProvider>
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
    backgroundColor: '#FFF4C2',
    borderColor: '#F0DEA0',
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
    color: '#1D2545',
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
    backgroundColor: '#FFF4C2',
  },
  metricTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  metricTabTextActive: {
    color: '#1D2545',
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

import { COLORS } from '@/constants/colors';
import {
  getSharedAnalysis,
  type SharedAnalysisRecord,
} from '@/services/shareAnalysis';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Report = SharedAnalysisRecord['payload'];

type MetricKey =
  | 'floatingPopulation'
  | 'livingPopulation'
  | 'storeCount'
  | 'competitionDensity'
  | 'salesAmount'
  | 'averageSalesPerStore'
  | 'busStopCount'
  | 'livingPopulationChangeRate'
  | 'floatingPopulationChangeRate';

type MetricType = 'people' | 'count' | 'decimal' | 'money' | 'percent';

type MetricDefinition = {
  key: MetricKey;
  label: string;
  type: MetricType;
  description: string;
};

const METRICS: MetricDefinition[] = [
  {
    key: 'floatingPopulation',
    label: '유동인구',
    type: 'people',
    description: '지역을 이동하거나 방문하는 인구 규모',
  },
  {
    key: 'livingPopulation',
    label: '생활인구',
    type: 'people',
    description: '지역에서 생활하거나 체류하는 인구 규모',
  },
  {
    key: 'storeCount',
    label: '동종 업종 점포 수',
    type: 'count',
    description: '해당 지역에 위치한 동일 업종 점포 수',
  },
  {
    key: 'competitionDensity',
    label: '경쟁 밀도',
    type: 'decimal',
    description: '해당 지역의 동종 업종 경쟁 수준',
  },
  {
    key: 'salesAmount',
    label: '전체 카드소비',
    type: 'money',
    description: '해당 지역의 전체 카드소비 규모',
  },
  {
    key: 'averageSalesPerStore',
    label: '점포당 카드소비',
    type: 'money',
    description: '점포 한 곳당 평균 카드소비 규모',
  },
  {
    key: 'busStopCount',
    label: '버스정류장 수',
    type: 'count',
    description: '해당 지역의 버스정류장 수',
  },
  {
    key: 'livingPopulationChangeRate',
    label: '생활인구 증감률',
    type: 'percent',
    description: '생활인구의 증가 또는 감소 비율',
  },
  {
    key: 'floatingPopulationChangeRate',
    label: '유동인구 증감률',
    type: 'percent',
    description: '유동인구의 증가 또는 감소 비율',
  },
];

const NAVY = COLORS.text;
const YELLOW = COLORS.warning;
const LIGHT_YELLOW = COLORS.warningLight;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMoney(value: number): string {
  if (Math.abs(value) >= 100000000) {
    const amount = value / 100000000;
    return `${Number(amount.toFixed(2)).toLocaleString('ko-KR')}억 원`;
  }

  if (Math.abs(value) >= 10000) {
    const amount = value / 10000;
    return `${Number(amount.toFixed(2)).toLocaleString('ko-KR')}만 원`;
  }

  return `${value.toLocaleString('ko-KR')}원`;
}

function formatMetric(
  value: unknown,
  type: MetricType,
): string {
  const number = toNumber(value);

  if (number === null) {
    return '데이터 없음';
  }

  switch (type) {
    case 'people':
      return `${number.toLocaleString('ko-KR')}명`;

    case 'count':
      return `${number.toLocaleString('ko-KR')}개`;

    case 'decimal':
      return number.toFixed(3);

    case 'money':
      return formatMoney(number);

    case 'percent':
      return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`;

    default:
      return String(number);
  }
}

function getMetricColor(
  index: number,
  value: unknown,
): string {
  if (toNumber(value) === null) {
    return COLORS.textSecondary;
  }

  return index % 2 === 0 ? NAVY : YELLOW;
}

function getReportValue(
  report: Report,
  key: MetricKey,
): unknown {
  // 기존 PDF 리포트와 같은 필드명을 사용
  const values = report as unknown as Record<string, unknown>;
  return values[key];
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <View style={styles.centerScreen}>
      <Text style={styles.errorIcon}>!</Text>
      <Text style={styles.errorTitle}>
        공유된 분석을 불러올 수 없어요
      </Text>
      <Text style={styles.errorDescription}>
        {message}
      </Text>
    </View>
  );
}

export default function SharedAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const [sharedAnalysis, setSharedAnalysis] =
    useState<SharedAnalysisRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const shareId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        if (!shareId) {
          throw new Error('공유 링크가 올바르지 않습니다.');
        }

        const result = await getSharedAnalysis(shareId);

        if (!active) return;

        if (!result) {
          throw new Error(
            '공유된 분석이 없거나 공유 기간이 만료되었습니다.',
          );
        }

        setSharedAnalysis(result);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : '공유 결과를 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [shareId]);

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          공유된 상권 분석을 불러오는 중...
        </Text>
      </View>
    );
  }

  if (error || !sharedAnalysis) {
    return (
      <ErrorScreen
        message={error || '공유 결과가 없습니다.'}
      />
    );
  }

  const report = sharedAnalysis.payload;

  const businessName = report.businessName || '업종 정보 없음';
  const areaName = report.areaName || '지역 정보 없음';

  const suitabilityScore = toNumber(
    report.suitabilityScore,
  );

  const rank = toNumber(report.rank);
  const totalCount = toNumber(report.totalCount);

  const scorePercent =
    suitabilityScore === null
      ? 0
      : Math.max(0, Math.min(100, suitabilityScore));

  const explanation = report.explanation;

  const summaryMetrics: MetricKey[] = [
    'floatingPopulation',
    'storeCount',
    'competitionDensity',
    'averageSalesPerStore',
  ];

  const formatSummary = (key: MetricKey) => {
    const definition = METRICS.find(metric => metric.key === key);

    if (!definition) return '데이터 없음';

    return formatMetric(
      getReportValue(report, key),
      definition.type,
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 브랜드 */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.brandTitle}>
            어디 차리지?
          </Text>
          <Text style={styles.pageSubtitle}>
            공유된 상권 분석 결과
          </Text>
        </View>

        <View style={styles.sharedBadge}>
          <Text style={styles.sharedBadgeText}>
            공유된 분석 결과
          </Text>
        </View>
      </View>

      {/* 상권 분석 요약 */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>
          {rank !== null && totalCount !== null
            ? `${rank}위 · 후보 ${totalCount}곳 중`
            : '상권 분석 결과'}
        </Text>

        <Text style={styles.heroTitle}>
          {areaName} 일대
        </Text>

        <Text style={styles.heroBusiness}>
          {businessName}
        </Text>

        {report.isPointAnalysis && (
          <Text style={styles.heroPointInfo}>
            위치 기반 분석
            {report.radius != null
              ? ` · 반경 ${report.radius}m`
              : ''}
          </Text>
        )}

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>
            종합 적합도
          </Text>

          <Text style={styles.scoreNumber}>
            {suitabilityScore === null
              ? '—'
              : Number(suitabilityScore.toFixed(1))}
          </Text>

          <Text style={styles.scoreTotal}>
            / 100
          </Text>
        </View>

        <View style={styles.heroProgressTrack}>
          <View
            style={[
              styles.heroProgressFill,
              { width: `${scorePercent}%` },
            ]}
          />
        </View>
      </View>

      {/* 핵심 지표 */}
      <Text style={styles.sectionHeading}>
        핵심 지표
      </Text>

      <View style={styles.summaryGrid}>
        {summaryMetrics.map((key, index) => {
          const definition = METRICS.find(
            metric => metric.key === key,
          );

          return (
            <View
              key={key}
              style={styles.summaryCard}
            >
              <View style={styles.summaryTop}>
                <View
                  style={[
                    styles.summaryDot,
                    {
                      backgroundColor:
                        index % 2 === 0 ? NAVY : YELLOW,
                    },
                  ]}
                />
                <Text style={styles.summaryLabel}>
                  {definition?.label ?? key}
                </Text>
              </View>

              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      index % 2 === 0 ? NAVY : YELLOW,
                  },
                ]}
              >
                {formatSummary(key)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 세부 지표 */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          세부 지표 비교
        </Text>

        <Text style={styles.sectionDescription}>
          저장된 상권 분석 지표를 항목별로 확인할 수 있어요.
        </Text>

        <View style={styles.metricList}>
          {METRICS.map((metric, index) => {
            const value = getReportValue(report, metric.key);
            const displayValue = formatMetric(
              value,
              metric.type,
            );

            const color = getMetricColor(index, value);

            const isPositiveRate =
              metric.type === 'percent' &&
              (toNumber(value) ?? 0) > 0;

            const isNegativeRate =
              metric.type === 'percent' &&
              (toNumber(value) ?? 0) < 0;

            return (
              <View
                key={metric.key}
                style={styles.metricCard}
              >
                <View style={styles.metricHeader}>
                  <View style={styles.metricHeadingRow}>
                    <View
                      style={[
                        styles.metricAccent,
                        { backgroundColor: color },
                      ]}
                    />

                    <Text style={styles.metricTitle}>
                      {metric.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metricDescription}>
                  {metric.description}
                </Text>

                <View style={styles.metricValueRow}>
                  <Text
                    style={[
                      styles.metricValue,
                      { color },
                    ]}
                  >
                    {displayValue}
                  </Text>

                  {isPositiveRate && (
                    <Text style={styles.rateInfo}>
                      증가
                    </Text>
                  )}

                  {isNegativeRate && (
                    <Text style={styles.rateInfo}>
                      감소
                    </Text>
                  )}
                </View>

                <View style={styles.metricBottomLine}>
                  <View
                    style={[
                      styles.metricBottomAccent,
                      { backgroundColor: color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.dataNotice}>
          ※ 각 지표는 분석 시점에 저장된 데이터입니다.
          서로 단위가 달라 단순한 수치 비교만으로
          창업 적합성을 판단할 수 없습니다.
        </Text>
      </View>

      {/* AI 분석 */}
      {explanation && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            AI 분석 전체 내용
          </Text>

          <Text style={styles.sectionDescription}>
            상권 데이터를 바탕으로 분석한 추천 이유와 고려사항입니다.
          </Text>

          {explanation.recommendationReason && (
            <View style={styles.aiBlock}>
              <Text style={styles.aiLabel}>
                추천 이유
              </Text>

              <View style={styles.reasonBox}>
                <Text style={styles.aiText}>
                  {explanation.recommendationReason}
                </Text>
              </View>
            </View>
          )}

          {Array.isArray(explanation.advantages) &&
            explanation.advantages.length > 0 && (
              <View style={styles.aiBlock}>
                <Text style={styles.aiLabel}>
                  장점
                </Text>

                {explanation.advantages.map((item, index) => (
                  <View
                    key={`advantage-${index}`}
                    style={styles.advantageBox}
                  >
                    <Text style={styles.advantageIcon}>
                      ✓
                    </Text>

                    <Text style={styles.aiText}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {Array.isArray(explanation.risks) &&
            explanation.risks.length > 0 && (
              <View style={styles.aiBlock}>
                <Text style={styles.aiLabel}>
                  주의할 점
                </Text>

                {explanation.risks.map((item, index) => (
                  <View
                    key={`risk-${index}`}
                    style={styles.riskBox}
                  >
                    <Text style={styles.riskIcon}>
                      !
                    </Text>

                    <Text style={styles.aiText}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {explanation.keyFeatures && (
            <View style={styles.aiBlock}>
              <Text style={styles.aiLabel}>
                주요 특징
              </Text>

              <View style={styles.aiNeutralBox}>
                <Text style={styles.aiText}>
                  {explanation.keyFeatures}
                </Text>
              </View>
            </View>
          )}

          {explanation.considerations && (
            <View style={styles.aiBlock}>
              <Text style={styles.aiLabel}>
                고려사항
              </Text>

              <View style={styles.aiNeutralBox}>
                <Text style={styles.aiText}>
                  {explanation.considerations}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 공유 안내 */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>
          어디 차리지?
        </Text>

        <Text style={styles.footerText}>
          이 화면은 공유 시점의 분석 결과를 보여줍니다.
        </Text>

        <Text style={styles.footerText}>
          상권 정보는 실제 창업 결정 시 현장 조사와 함께
          참고해주세요.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 70,
  },

  centerScreen: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorIcon: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  errorDescription: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },

  brandTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  sharedBadge: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  heroCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 26,
    marginBottom: 28,
  },

  heroEyebrow: {
    fontSize: 12,
    color: '#ABABAB',
    marginBottom: 14,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  heroBusiness: {
    marginTop: 12,
    fontSize: 15,
    color: '#F1F1F1',
  },

  heroPointInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#D1D5DB',
  },

  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 28,
    gap: 7,
  },

  scoreLabel: {
    fontSize: 12,
    color: '#B5B5B5',
  },

  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: YELLOW,
  },

  scoreTotal: {
    fontSize: 12,
    color: '#B5B5B5',
  },

  heroProgressTrack: {
    marginTop: 14,
    height: 9,
    backgroundColor: '#394154',
    borderRadius: 999,
    overflow: 'hidden',
  },

  heroProgressFill: {
    height: '100%',
    backgroundColor: YELLOW,
    borderRadius: 999,
  },

  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 14,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },

  summaryCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 145,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 17,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },

  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },

  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  sectionDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 18,
  },

  metricList: {
    gap: 12,
  },

  metricCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 16,
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metricHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  metricAccent: {
    width: 5,
    height: 19,
    borderRadius: 3,
  },

  metricTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  metricDescription: {
    marginTop: 9,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  metricValueRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  metricValue: {
    fontSize: 24,
    fontWeight: '900',
  },

  rateInfo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  metricBottomLine: {
    marginTop: 15,
    height: 4,
    width: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
  },

  metricBottomAccent: {
    height: '100%',
    width: '32%',
    borderRadius: 999,
  },

  dataNotice: {
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 18,
  },

  aiBlock: {
    marginBottom: 17,
  },

  aiLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },

  aiText: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.text,
    flexShrink: 1,
  },

  reasonBox: {
    padding: 15,
    backgroundColor: LIGHT_YELLOW,
    borderRadius: 13,
  },

  advantageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: '#F1FBF3',
  },

  advantageIcon: {
    fontSize: 17,
    fontWeight: '900',
    color: '#278848',
  },

  riskBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: LIGHT_YELLOW,
  },

  riskIcon: {
    fontSize: 17,
    fontWeight: '900',
    color: YELLOW,
  },

  aiNeutralBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 12,
  },

  footerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});

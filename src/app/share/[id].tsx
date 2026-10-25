import { COLORS } from '@/constants/colors';
import {
  getSharedAnalysis,
  type SharedAnalysisRecord,
} from '@/services/shareAnalysis';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function formatNumber(value: number) {
  return Number.isFinite(value)
    ? Math.round(value).toLocaleString('ko-KR')
    : '-';
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) {
    return '-';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function renderMarkdownText(text?: string) {
  if (!text) {
    return null;
  }

  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} style={styles.aiStrong}>
          {part.slice(2, -2)}
        </Text>
      );
    }

    return part;
  });
}

export default function SharedAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] =
    useState<SharedAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setErrorMessage('잘못된 공유 링크입니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');

        const result = await getSharedAnalysis(id);

        if (!result) {
          setErrorMessage(
            '공유된 분석 결과가 없거나 만료된 링크입니다.',
          );
          return;
        }

        setRecord(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '분석 결과를 불러오지 못했습니다.',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
          <Text style={styles.loadingText}>
            공유된 분석 결과를 불러오는 중...
          </Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            분석 결과를 열 수 없어요
          </Text>
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
      ) : record ? (
        <SharedAnalysisContent record={record} />
      ) : null}
    </View>
  );
}

function SharedAnalysisContent({
  record,
}: {
  record: SharedAnalysisRecord;
}) {
  const data = record.payload;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brand}>어디 차리지?</Text>
        <Text style={styles.sharedBadge}>
          공유된 분석 결과
        </Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>
          {data.rank}위 · 후보 {data.totalCount}곳 중
        </Text>

        <Text style={styles.heroTitle}>
          {data.areaName} 일대
        </Text>

        <Text style={styles.heroBusiness}>
          {data.businessName}
        </Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>
            종합 적합도
          </Text>
          <Text style={styles.score}>
            {data.suitabilityScore}
          </Text>
          <Text style={styles.scoreUnit}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        핵심 지표
      </Text>

      <View style={styles.metricGrid}>
        <Metric
          label={
            data.isPointAnalysis
              ? '추정 유동인구'
              : '유동인구'
          }
          value={`${formatNumber(
            data.floatingPopulation,
          )}명`}
        />
        <Metric
          label={`${data.businessName} 수`}
          value={`${formatNumber(data.storeCount)}개`}
        />
        <Metric
          label="경쟁밀도"
          value={
            Number.isFinite(data.competitionDensity)
              ? data.competitionDensity.toFixed(3)
              : '-'
          }
        />
        <Metric
          label="점포당 카드소비"
          value={`${formatNumber(
            data.averageSalesPerStore,
          )}원`}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>
          전체 지표
        </Text>

        <DetailRow
          label="후보 순위"
          value={`${data.rank}위 / ${data.totalCount}곳`}
        />
        <DetailRow
          label="종합 적합도"
          value={`${data.suitabilityScore} / 100`}
        />
        <DetailRow
          label="유동인구"
          value={`${formatNumber(
            data.floatingPopulation,
          )}명`}
        />
        <DetailRow
          label="생활인구"
          value={`${formatNumber(
            data.livingPopulation,
          )}명`}
        />
        <DetailRow
          label="점포 수"
          value={`${formatNumber(data.storeCount)}개`}
        />
        <DetailRow
          label="경쟁밀도"
          value={
            Number.isFinite(data.competitionDensity)
              ? data.competitionDensity.toFixed(3)
              : '-'
          }
        />
        <DetailRow
          label="전체 카드소비"
          value={`${formatNumber(data.salesAmount)}원`}
        />
        <DetailRow
          label="점포당 카드소비"
          value={`${formatNumber(
            data.averageSalesPerStore,
          )}원`}
        />
        <DetailRow
          label="생활인구 증감률"
          value={formatChange(
            data.livingPopulationChangeRate,
          )}
        />
        <DetailRow
          label="유동인구 증감률"
          value={formatChange(
            data.floatingPopulationChangeRate,
          )}
        />
        <DetailRow
          label="버스정류장"
          value={`${formatNumber(
            data.busStopCount,
          )}개`}
          last
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>
          AI 분석 전체 내용
        </Text>

        {data.explanation ? (
          <>
            <Text style={styles.aiSubTitle}>
              추천 이유
            </Text>
            <Text style={styles.aiReason}>
              {renderMarkdownText(
                data.explanation.recommendationReason,
              )}
            </Text>

            <Text style={styles.aiSubTitle}>
              장점
            </Text>
            <View style={styles.aiList}>
              {data.explanation.advantages?.length ? (
                data.explanation.advantages.map(
                  (item, index) => (
                    <View
                      key={`good-${index}`}
                      style={styles.goodItem}
                    >
                      <Text style={styles.goodIcon}>
                        ✓
                      </Text>
                      <Text style={styles.goodText}>
                        {renderMarkdownText(item)}
                      </Text>
                    </View>
                  ),
                )
              ) : (
                <Text style={styles.muted}>
                  표시할 내용이 없습니다.
                </Text>
              )}
            </View>

            <Text style={styles.aiSubTitle}>
              주의할 점
            </Text>
            <View style={styles.aiList}>
              {data.explanation.risks?.length ? (
                data.explanation.risks.map(
                  (item, index) => (
                    <View
                      key={`risk-${index}`}
                      style={styles.riskItem}
                    >
                      <Text style={styles.riskIcon}>
                        !
                      </Text>
                      <Text style={styles.riskText}>
                        {renderMarkdownText(item)}
                      </Text>
                    </View>
                  ),
                )
              ) : (
                <Text style={styles.muted}>
                  표시할 내용이 없습니다.
                </Text>
              )}
            </View>

            <Text style={styles.aiSubTitle}>
              주요 특징
            </Text>
            <View style={styles.aiDetailBlock}>
              <Text style={styles.aiDetailText}>
                {data.explanation.keyFeatures
                  ? renderMarkdownText(
                      data.explanation.keyFeatures,
                    )
                  : '표시할 내용이 없습니다.'}
              </Text>
            </View>

            <Text style={styles.aiSubTitle}>
              고려사항
            </Text>
            <View style={styles.aiDetailBlock}>
              <Text style={styles.aiDetailText}>
                {data.explanation.considerations
                  ? renderMarkdownText(
                      data.explanation.considerations,
                    )
                  : '표시할 내용이 없습니다.'}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.muted}>
            공유 시점에 AI 분석 결과가
            준비되지 않았습니다.
          </Text>
        )}
      </View>

      {!!data.compareItems?.length && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>
            다른 후보와 비교
          </Text>

          {data.compareItems.map((item, index) => (
            <View
              key={`${item.areaName}-${index}`}
              style={styles.compareCard}
            >
              <View style={styles.compareHeader}>
                <Text style={styles.compareArea}>
                  {item.areaName}
                </Text>
                <Text style={styles.compareRank}>
                  {item.rank}위
                </Text>
              </View>

              <View style={styles.compareMetrics}>
                <CompareMetric
                  label="유동인구"
                  value={item.floatingPopulationScore}
                />
                <CompareMetric
                  label="생활인구"
                  value={item.livingPopulationScore}
                />
                <CompareMetric
                  label="전체 소비"
                  value={item.salesScore}
                />
                <CompareMetric
                  label="점포당 소비"
                  value={item.averageSalesScore}
                />
                <CompareMetric
                  label="경쟁 여유도"
                  value={item.competitionScore}
                />
                <CompareMetric
                  label="교통 접근성"
                  value={item.accessibilityScore}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {!!data.nearbyStores?.length && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>
            주변 실제 {data.businessName} 매장
          </Text>

          {data.nearbyStores.map((store, index) => (
            <View
              key={`${store.name}-${index}`}
              style={styles.storeRow}
            >
              <Text style={styles.storeName}>
                {store.name}
              </Text>
              <Text style={styles.storeAddress}>
                {store.address || '-'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>
        이 페이지는 어디 차리지?에서 공유된
        상권 분석 결과입니다.
      </Text>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>
      <Text style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        last && styles.detailRowLast,
      ]}
    >
      <Text style={styles.detailLabel}>
        {label}
      </Text>
      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function CompareMetric({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <View style={styles.compareMetric}>
      <Text style={styles.compareMetricLabel}>
        {label}
      </Text>
      <Text style={styles.compareMetricValue}>
        {typeof value === 'number' &&
        Number.isFinite(value)
          ? value.toFixed(1)
          : '-'}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  brandRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#202544',
  },
  sharedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFF5C2',
    fontSize: 10,
    fontWeight: '800',
    color: '#202544',
  },
  hero: {
    padding: 24,
    marginBottom: 22,
    borderRadius: 22,
    backgroundColor: '#202544',
  },
  heroEyebrow: {
    fontSize: 11,
    color: '#B5B9CB',
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroBusiness: {
    marginTop: 5,
    fontSize: 13,
    color: '#D5D9E5',
  },
  scoreRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  scoreLabel: {
    marginBottom: 4,
    fontSize: 11,
    color: '#B5B9CB',
  },
  score: {
    fontSize: 31,
    lineHeight: 33,
    fontWeight: '900',
    color: '#FFDA35',
  },
  scoreUnit: {
    marginBottom: 4,
    fontSize: 12,
    color: '#B5B9CB',
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '900',
    color: '#202544',
  },
  metricGrid: {
    marginBottom: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 220,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  metricLabel: {
    marginBottom: 6,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#202544',
  },
  sectionCard: {
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  sectionCardTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '900',
    color: '#202544',
  },
  detailRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
    color: '#202544',
  },
  aiSubTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '900',
    color: '#202544',
  },
  aiReason: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF8DC',
    fontSize: 12,
    lineHeight: 19,
    color: '#202544',
  },
  aiStrong: {
    fontWeight: '900',
    color: '#202544',
  },
  aiList: {
    gap: 8,
  },
  goodItem: {
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#FFF9E5',
  },
  goodIcon: {
    fontWeight: '900',
    color: '#202544',
  },
  goodText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#202544',
  },
  riskItem: {
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#FFF0ED',
  },
  riskIcon: {
    fontWeight: '900',
    color: '#EF302B',
  },
  riskText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#B73530',
  },
  aiDetailBlock: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F6F7FC',
  },
  aiDetailText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#202544',
  },
  compareCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compareHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compareArea: {
    fontSize: 13,
    fontWeight: '900',
    color: '#202544',
  },
  compareRank: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF302B',
  },
  compareMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compareMetric: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 110,
    padding: 9,
    borderRadius: 9,
    backgroundColor: '#F6F7FC',
  },
  compareMetricLabel: {
    marginBottom: 3,
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  compareMetricValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#202544',
  },
  storeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#202544',
  },
  storeAddress: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textSecondary,
  },
  muted: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});

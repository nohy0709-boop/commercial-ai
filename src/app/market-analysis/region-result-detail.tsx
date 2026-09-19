import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { AIExplanation } from '@/services/aiExplanation';
import { generateAIExplanation } from '@/services/aiExplanation';

import {
  getAnalysisHistory,
  saveAnalysis,
  toggleAnalysisFavorite,
} from '@/services/analysisHistory';

import type { NearbyStore } from '@/services/storeApi';
import { getStoreList } from '@/services/storeApi';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

/**
 * AI 응답의 **강조 문구** 표시
 */
function renderEmphasizedText(
  text: string,
  textStyle: object,
) {
  const parts =
    text.split(
      /(\*\*.*?\*\*)/g,
    );

  return (
    <Text style={textStyle}>
      {parts.map(
        (
          part,
          index,
        ) => {
          if (
            part.startsWith(
              '**',
            ) &&
            part.endsWith(
              '**',
            )
          ) {
            return (
              <Text
                key={index}
                style={
                  styles.aiHighlight
                }
              >
                {part.slice(
                  2,
                  -2,
                )}
              </Text>
            );
          }

          return part;
        },
      )}
    </Text>
  );
}

/**
 * 증감률 표시
 */
function formatChangeRate(
  value: number,
) {
  if (
    Number.isNaN(
      value,
    )
  ) {
    return '데이터 없음';
  }

  return `${
    value > 0
      ? '+'
      : ''
  }${value.toFixed(
    2,
  )}%`;
}

// 점수를 매길 때 쓴 8개 지표를, 화면에서 다루기 좋게 3개 범주로 묶었습니다.
const METRIC_GROUPS = [
  {
    key: 'population',
    label: '인구 지표',
    metrics: [
      { key: 'floatingPopulationScore', label: '유동인구' },
      { key: 'livingPopulationScore', label: '생활인구' },
      { key: 'floatingPopulationChangeScore', label: '유동인구 증가세' },
      { key: 'livingPopulationChangeScore', label: '생활인구 증가세' },
    ],
  },
  {
    key: 'sales',
    label: '소비 지표',
    metrics: [
      { key: 'salesScore', label: '전체 소비' },
      { key: 'averageSalesScore', label: '점포당 소비' },
    ],
  },
  {
    key: 'environment',
    label: '환경 지표',
    metrics: [
      { key: 'competitionScore', label: '경쟁 여유도' },
      { key: 'accessibilityScore', label: '교통 접근성' },
    ],
  },
];

const CHART_COLORS = [
  '#1D4ED8',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
];

type CompareItem = {
  areaName: string;
  rank: number;
  [scoreKey: string]: number | string;
};

// 여러 지역을 하나의 선그래프로 비교합니다 (온도 그래프처럼, 지역마다 선 하나씩).
function MultiAreaLineChart({
  metrics,
  series,
}: {
  metrics: { key: string; label: string }[];
  series: { name: string; color: string; values: number[] }[];
}) {
  const W = 300;
  const H = 170;
  const padLeft = 22;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 30;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const xFor = (i: number) =>
    metrics.length > 1
      ? padLeft + (i / (metrics.length - 1)) * plotW
      : padLeft + plotW / 2;
  const yFor = (v: number) =>
    padTop + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;

  const gridLines = [0, 50, 100];

  return (
    <View>
      <View style={styles.legendRow}>
        {series.map(s => (
          <View key={s.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.name}</Text>
          </View>
        ))}
      </View>

      <Svg width="100%" height={190} viewBox={`0 0 ${W} ${H}`}>
        {gridLines.map(g => (
          <Line
            key={g}
            x1={padLeft}
            x2={W - padRight}
            y1={yFor(g)}
            y2={yFor(g)}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
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
              r={3}
              fill={s.color}
            />
          )),
        )}

        {metrics.map((m, i) => (
          <SvgText
            key={m.key}
            x={xFor(i)}
            y={H - 8}
            fontSize="9"
            fill="#6B7280"
            textAnchor="middle"
          >
            {m.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function RegionResultDetailScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      businessName: string;

      areaName: string;

      rank: string;

      totalCount: string;

      suitabilityScore: string;

      floatingPopulation: string;

      livingPopulation: string;

      storeCount: string;

      competitionDensity: string;

      salesAmount: string;

      averageSalesPerStore: string;

      busStopCount: string;

      livingPopulationChangeRate: string;

      floatingPopulationChangeRate: string;

      compareData?: string;

      /**
       * 위치 기반 분석용
       */
      analysisType?: string;

      dongName?: string;

      latitude?: string;

      longitude?: string;

      radius?: string;
    }>();

  const {
    businessName,

    areaName,

    rank,

    totalCount,

    suitabilityScore,

    floatingPopulation,

    livingPopulation,

    storeCount,

    competitionDensity,

    salesAmount,

    averageSalesPerStore,

    busStopCount,

    livingPopulationChangeRate,

    floatingPopulationChangeRate,

    compareData,

    analysisType,

    dongName,

    latitude,

    longitude,

    radius,
  } =
    params;

  /**
   * 위치 기반 분석 여부
   */
  const isPointAnalysis =
    analysisType ===
    'point';

  /**
   * 실제 행정동 이름
   *
   * 일반 동 분석:
   * areaName
   *
   * 위치 기반 분석:
   * dongName
   */
  const actualDongName =
    dongName ||
    areaName;

  /**
   * 행정동 찾기
   */
  const area =
    sejongAreas.find(
      item =>
        item.name ===
        actualDongName,
    );

  /**
   * 업종 찾기
   */
  const business =
    businessCategories
      .flatMap(
        category =>
          category.businesses,
      )
      .find(
        item =>
          item.name ===
          businessName,
      );

  /**
   * =====================================================
   * AI 분석
   * =====================================================
   */
  const [
    explanation,
    setExplanation,
  ] =
    useState<
      AIExplanation | null
    >(
      null,
    );

  const [
    aiLoading,
    setAiLoading,
  ] =
    useState(
      true,
    );

  const [
    aiError,
    setAiError,
  ] =
    useState(
      '',
    );

  const [
    detailExpanded,
    setDetailExpanded,
  ] =
    useState(
      false,
    );

  /**
   * =====================================================
   * 주변 실제 점포
   * =====================================================
   */
  const [
    nearbyStores,
    setNearbyStores,
  ] =
    useState<
      NearbyStore[]
    >([]);

  const [
    storesLoading,
    setStoresLoading,
  ] =
    useState(
      true,
    );

  const [
    storesError,
    setStoresError,
  ] =
    useState(
      '',
    );

  /**
   * =====================================================
   * 찜 / 저장
   * =====================================================
   */
  const [
    favorite,
    setFavorite,
  ] =
    useState(
      false,
    );

  const [
    savedAnalysisId,
    setSavedAnalysisId,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    favoriteLoading,
    setFavoriteLoading,
  ] =
    useState(
      false,
    );

  const [
    rawNumbersExpanded,
    setRawNumbersExpanded,
  ] =
    useState(
      false,
    );

  const [
    activeMetricGroup,
    setActiveMetricGroup,
  ] =
    useState(
      METRIC_GROUPS[0].key,
    );

  /**
   * =====================================================
   * AI 분석 요청
   * =====================================================
   */
  useEffect(() => {
    const run =
      async () => {
        try {
          setAiLoading(
            true,
          );

          setAiError(
            '',
          );

          const result =
            await generateAIExplanation(
              {
                지역:
                  areaName,

                업종:
                  businessName,

                유동인구:
                  Number(
                    floatingPopulation,
                  ),

                생활인구:
                  Number(
                    livingPopulation,
                  ),

                점포수:
                  Number(
                    storeCount,
                  ),

                경쟁밀도:
                  Number(
                    competitionDensity,
                  ),

                전체카드소비:
                  Number(
                    salesAmount,
                  ),

                점포당카드소비:
                  Number(
                    averageSalesPerStore,
                  ),

                버스정류장수:
                  Number(
                    busStopCount,
                  ),

                적합도점수:
                  Number(
                    suitabilityScore,
                  ),

                순위:
                  Number(
                    rank,
                  ),
              },
            );

          setExplanation(
            result,
          );
        } catch (error) {
          console.error(
            'AI 설명 생성 오류:',
            error,
          );

          setAiError(
            error instanceof
              Error
              ? error.message
              : 'AI 설명을 가져오지 못했습니다.',
          );
        } finally {
          setAiLoading(
            false,
          );
        }
      };

    run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * =====================================================
   * 실제 점포 목록 조회
   * =====================================================
   */
  useEffect(() => {
    if (
      !area ||
      !business
    ) {
      console.log(
        '점포 조회 불가:',
        {
          actualDongName,

          businessName,

          area,

          business,
        },
      );

      setStoresLoading(
        false,
      );

      return;
    }

    const run =
      async () => {
        try {
          setStoresLoading(
            true,
          );

          setStoresError(
            '',
          );

          const stores =
            await getStoreList(
              area.code,

              business.lclsCode,

              business.mclsCode,

              business.sclsCode,

              10,
            );

          console.log(
            '상세화면 점포 조회 결과:',
            stores,
          );

          setNearbyStores(
            stores,
          );
        } catch (error) {
          console.error(
            '주변 점포 조회 오류:',
            error,
          );

          setStoresError(
            error instanceof
              Error
              ? error.message
              : '주변 점포 정보를 가져오지 못했습니다.',
          );
        } finally {
          setStoresLoading(
            false,
          );
        }
      };

    run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * =====================================================
   * 이미 저장된 분석인지 확인
   * =====================================================
   */
  useEffect(() => {
    const checkSaved =
      async () => {
        try {
          const histories =
            await getAnalysisHistory();

          /**
           * 같은 지역 + 같은 업종 +
           * 같은 분석 방식이면
           * 동일 분석으로 간주
           */
          const existing =
            histories.find(
              history => {
                const data =
                  history.resultData;

                if (
                  history.businessName !==
                  businessName
                ) {
                  return false;
                }

                if (
                  !history.regions.includes(
                    areaName,
                  )
                ) {
                  return false;
                }

                /**
                 * 위치 기반이면
                 * 좌표 / 반경도 확인
                 */
                if (
                  isPointAnalysis
                ) {
                  return (
                    data?.analysisType ===
                      'point' &&
                    String(
                      data?.latitude ??
                        '',
                    ) ===
                      String(
                        latitude ??
                          '',
                      ) &&
                    String(
                      data?.longitude ??
                        '',
                    ) ===
                      String(
                        longitude ??
                          '',
                      ) &&
                    String(
                      data?.radius ??
                        '',
                    ) ===
                      String(
                        radius ??
                          '',
                      )
                  );
                }

                return (
                  data?.analysisType !==
                  'point'
                );
              },
            );

          if (
            !existing
          ) {
            return;
          }

          setSavedAnalysisId(
            existing.id,
          );

          setFavorite(
            existing.isFavorite ??
              false,
          );
        } catch (error) {
          console.error(
            '저장된 분석 확인 실패:',
            error,
          );
        }
      };

    checkSaved();
  }, [
    businessName,
    areaName,
    isPointAnalysis,
    latitude,
    longitude,
    radius,
  ]);

  /**
   * =====================================================
   * 하트 버튼
   * =====================================================
   */
  const handleFavorite =
    async () => {
      if (
        favoriteLoading
      ) {
        return;
      }

      try {
        setFavoriteLoading(
          true,
        );

        /**
         * 이미 분석 기록이 저장되어 있으면
         * 찜 상태만 변경
         */
        if (
          savedAnalysisId
        ) {
          const updated =
            await toggleAnalysisFavorite(
              savedAnalysisId,
            );

          if (
            updated
          ) {
            setFavorite(
              updated.isFavorite ??
                false,
            );
          }

          return;
        }

        /**
         * 저장되지 않은 분석이면
         * 하트를 누르는 순간
         * 분석 기록에 추가 + 찜
         */
        const saved =
          await saveAnalysis(
            {
              type:
                'comparison',

              title:
                `${areaName} ${businessName} 분석`,

              businessName,

              regions: [
                areaName,
              ],

              isFavorite:
                true,

              resultData: {
                businessName,

                areaName,

                rank:
                  Number(
                    rank,
                  ),

                totalCount:
                  Number(
                    totalCount,
                  ),

                suitabilityScore:
                  Number(
                    suitabilityScore,
                  ),

                floatingPopulation:
                  Number(
                    floatingPopulation,
                  ),

                livingPopulation:
                  Number(
                    livingPopulation,
                  ),

                storeCount:
                  Number(
                    storeCount,
                  ),

                competitionDensity:
                  Number(
                    competitionDensity,
                  ),

                salesAmount:
                  Number(
                    salesAmount,
                  ),

                averageSalesPerStore:
                  Number(
                    averageSalesPerStore,
                  ),

                busStopCount:
                  Number(
                    busStopCount,
                  ),

                livingPopulationChangeRate:
                  Number(
                    livingPopulationChangeRate,
                  ),

                floatingPopulationChangeRate:
                  Number(
                    floatingPopulationChangeRate,
                  ),

                analysisType:
                  isPointAnalysis
                    ? 'point'
                    : 'area',

                dongName:
                  actualDongName,

                latitude:
                  latitude
                    ? Number(
                        latitude,
                      )
                    : null,

                longitude:
                  longitude
                    ? Number(
                        longitude,
                      )
                    : null,

                radius:
                  radius
                    ? Number(
                        radius,
                      )
                    : null,
              },
            },
          );

        setSavedAnalysisId(
          saved.id,
        );

        setFavorite(
          true,
        );
      } catch (error) {
        console.error(
          '찜 저장 실패:',
          error,
        );

        Alert.alert(
          '오류',
          '분석 결과를 저장하지 못했습니다.',
        );
      } finally {
        setFavoriteLoading(
          false,
        );
      }
    };

  // 비교 데이터 파싱 (최대 5개 + 현재 지역은 항상 포함)
  let compareItems: CompareItem[] = [];

  try {
    compareItems = JSON.parse(compareData || '[]');
  } catch (error) {
    console.error('비교 데이터 파싱 오류:', error);
  }

  let chartItems = compareItems.slice(0, 5);

  if (!chartItems.find(item => item.areaName === areaName)) {
    const current = compareItems.find(item => item.areaName === areaName);

    if (current) {
      chartItems = [...chartItems, current];
    }
  }

  const activeGroup =
    METRIC_GROUPS.find(group => group.key === activeMetricGroup) ??
    METRIC_GROUPS[0];

  const chartSeries = chartItems.map((item, index) => ({
    name: `${item.rank}위 ${item.areaName}`,
    color: CHART_COLORS[index % CHART_COLORS.length],
    values: activeGroup.metrics.map(metric => Number(item[metric.key]) || 0),
  }));

  return (
    <View style={styles.screen}>
      {/* 상단 앱바 */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.appBarTitle}>상세 분석</Text>
          <Text style={styles.appBarSubtitle}>
            {areaName} · {businessName}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
      {/* =========================
          HEADER (LEVEL 1)
      ========================== */}

      <View
        style={
          styles.headerCard
        }
      >
        <View
          style={
            styles.headerTopRow
          }
        >
          <View
            style={
              styles.rankPill
            }
          >
            <Text
              style={
                styles.rankPillText
              }
            >
              {rank}위 추천
            </Text>
          </View>

          <Text
            style={
              styles.headerSubText
            }
          >
            {`${businessName} 후보 ${totalCount}곳 중`}
          </Text>
        </View>

        {/* 지역 이름 + 점수/하트 */}
        <View
          style={
            styles.titleRow
          }
        >
          <View
            style={
              styles.titleArea
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              {`${areaName} 일대`}
            </Text>

            <Text
              style={
                styles.headerBusiness
              }
            >
              {businessName}
            </Text>

            {isPointAnalysis &&
              radius && (
                <Text
                  style={
                    styles.pointSubtitle
                  }
                >
                  {actualDongName} · 반경{' '}
                  {radius}m 위치 기반 분석
                </Text>
              )}
          </View>

          <View style={styles.scoreCol}>
            <Text
              style={
                styles.scoreValue
              }
            >
              {
                suitabilityScore
              }
            </Text>

            <Text
              style={
                styles.scoreLabel
              }
            >
              종합 적합도
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.favoriteButton,

            favorite &&
              styles.favoriteButtonActive,
          ]}
          activeOpacity={
            0.8
          }
          disabled={
            favoriteLoading
          }
          onPress={
            handleFavorite
          }
        >
          {favoriteLoading ? (
            <ActivityIndicator
              size="small"
              color={
                favorite
                  ? '#FFFFFF'
                  : '#E54861'
              }
            />
          ) : (
            <>
              <Text
                style={[
                  styles.favoriteText,

                  favorite &&
                    styles.favoriteTextActive,
                ]}
              >
                {favorite
                  ? '♥'
                  : '♡'}
              </Text>
              <Text
                style={[
                  styles.favoriteLabel,
                  favorite && styles.favoriteLabelActive,
                ]}
              >
                {favorite ? '찜한 분석' : '분석 찜하기'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* =========================
          핵심 지표
      ========================== */}

      <View
        style={
          styles.metricGrid
        }
      >
        <View
          style={
            styles.metricBox
          }
        >
          <Text
            style={
              styles.metricLabel
            }
          >
            {isPointAnalysis
              ? '추정 유동인구'
              : '유동인구'}
          </Text>

          <Text
            style={
              styles.metricValue
            }
          >
            {Number(
              floatingPopulation,
            ).toLocaleString()}
            명
          </Text>
        </View>

        <View
          style={
            styles.metricBox
          }
        >
          <Text
            style={
              styles.metricLabel
            }
          >
            {isPointAnalysis
              ? `반경 내 ${businessName} 수`
              : `${businessName} 수`}
          </Text>

          <Text
            style={
              styles.metricValue
            }
          >
            {
              storeCount
            }
            개
          </Text>
        </View>

        <View
          style={
            styles.metricBox
          }
        >
          <Text
            style={
              styles.metricLabel
            }
          >
            경쟁밀도
          </Text>

          <Text
            style={
              styles.metricValue
            }
          >
            {Number(
              competitionDensity,
            ).toFixed(
              3,
            )}
          </Text>
        </View>

        <View
          style={
            styles.metricBox
          }
        >
          <Text
            style={
              styles.metricLabel
            }
          >
            점포당 카드소비
          </Text>

          <Text
            style={
              styles.metricValue
            }
          >
            {Math.round(
              Number(
                averageSalesPerStore,
              ),
            ).toLocaleString()}
            원
          </Text>
        </View>
      </View>

      {chartSeries.length > 0 && (
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>다른 후보와 비교</Text>
          <Text style={styles.sectionDescription}>
            같이 분석한 다른 지역들과 점수를 비교해봤어요 (0~100점).
          </Text>

          <View style={styles.tabRow}>
            {METRIC_GROUPS.map(group => {
              const isActive = activeMetricGroup === group.key;

              return (
                <TouchableOpacity
                  key={group.key}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  activeOpacity={0.7}
                  onPress={() => setActiveMetricGroup(group.key)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.tabButtonTextActive,
                    ]}
                  >
                    {group.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <MultiAreaLineChart
            metrics={activeGroup.metrics}
            series={chartSeries}
          />

          <TouchableOpacity
            style={styles.detailToggleButton}
            activeOpacity={0.7}
            onPress={() => setRawNumbersExpanded(prev => !prev)}
          >
            <Text style={styles.detailToggleText}>
              {rawNumbersExpanded ? '실제 수치 접기 ▲' : '실제 수치로 보기 ▼'}
            </Text>
          </TouchableOpacity>

          {rawNumbersExpanded && (
            <View style={styles.aiDetailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>생활인구</Text>
                <Text style={styles.detailValue}>
                  {Number(livingPopulation).toLocaleString()}명
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>생활인구 증감률</Text>
                <Text style={styles.detailValue}>
                  {formatChangeRate(Number(livingPopulationChangeRate))}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>유동인구 증감률</Text>
                <Text style={styles.detailValue}>
                  {formatChangeRate(Number(floatingPopulationChangeRate))}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>전체 카드소비</Text>
                <Text style={styles.detailValue}>
                  {Number(salesAmount).toLocaleString()}원
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>버스정류장</Text>
                <Text style={styles.detailValue}>{busStopCount}개</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* =========================
          주변 실제 점포
      ========================== */}

      <View
        style={
          styles.sectionBox
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          주변 실제{' '}
          {
            businessName
          }{' '}
          매장
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          공공데이터에 등록된
          이 지역의 실제 매장
          정보예요.
        </Text>

        {Platform.OS !==
          'web' &&
          nearbyStores.length >
            0 && (
            <NativeStoreMap
              stores={
                nearbyStores
              }
            />
          )}

        {storesLoading && (
          <View
            style={
              styles.smallLoadingBox
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.primary
              }
            />

            <Text
              style={
                styles.smallLoadingText
              }
            >
              주변 매장 정보를
              불러오는 중...
            </Text>
          </View>
        )}

        {!storesLoading &&
          storesError !==
            '' && (
            <Text
              style={
                styles.storesError
              }
            >
              {
                storesError
              }
            </Text>
          )}

        {!storesLoading &&
          storesError ===
            '' &&
          nearbyStores.length ===
            0 && (
            <Text
              style={
                styles.storesEmpty
              }
            >
              등록된 매장 정보를
              찾지 못했어요.
            </Text>
          )}

        {!storesLoading &&
          nearbyStores.map(
            (
              store,
              index,
            ) => (
              <View
                key={`${store.name}-${index}`}
                style={
                  styles.storeRow
                }
              >
                <Text
                  style={
                    styles.storeName
                  }
                >
                  {
                    store.name
                  }
                </Text>

                <Text
                  style={
                    styles.storeAddress
                  }
                >
                  {
                    store.address
                  }
                </Text>
              </View>
            ),
          )}
      </View>

      {/* =========================
          지역 환경 상세
      ========================== */}

      <View
        style={
          styles.sectionBox
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          지역 환경 상세
        </Text>

        {isPointAnalysis && (
          <Text
            style={
              styles.estimateNotice
            }
          >
            위치 기반 분석의 인구·카드소비·접근성
            지표는 행정동 데이터를 반경 내 점포
            집중도에 따라 세분화한 추정값입니다.
          </Text>
        )}

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            {isPointAnalysis
              ? '추정 생활인구'
              : '생활인구'}
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            {Number(
              livingPopulation,
            ).toLocaleString()}
            명
          </Text>
        </View>

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            생활인구 증감률
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            {formatChangeRate(
              Number(
                livingPopulationChangeRate,
              ),
            )}
          </Text>
        </View>

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            유동인구 증감률
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            {formatChangeRate(
              Number(
                floatingPopulationChangeRate,
              ),
            )}
          </Text>
        </View>

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            {isPointAnalysis
              ? '추정 카드소비'
              : '전체 카드소비'}
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            {Number(
              salesAmount,
            ).toLocaleString()}
            원
          </Text>
        </View>

        <View
          style={
            styles.detailRow
          }
        >
          <Text
            style={
              styles.detailLabel
            }
          >
            {isPointAnalysis
              ? '추정 버스정류장'
              : '버스정류장'}
          </Text>

          <Text
            style={
              styles.detailValue
            }
          >
            {
              busStopCount
            }
            개
          </Text>
        </View>
      </View>

      {/* =========================
          AI 분석
      ========================== */}

      <View
        style={
          styles.aiSectionBox
        }
      >
        <View style={styles.aiSectionTitleRow}>
          <View style={styles.aiIconBox}>
            <Text style={styles.aiIconText}>✨</Text>
          </View>
          <Text
            style={
              styles.aiSectionTitle
            }
          >
            AI 상권 인사이트
          </Text>
        </View>

        {aiLoading && (
          <View
            style={
              styles.smallLoadingBox
            }
          >
            <ActivityIndicator
              size="small"
              color={
                COLORS.ai
              }
            />

            <Text
              style={
                styles.smallLoadingText
              }
            >
              AI가 분석하는 중...
            </Text>
          </View>
        )}

        {!aiLoading &&
          aiError !==
            '' && (
            <Text
              style={
                styles.storesError
              }
            >
              {
                aiError
              }
            </Text>
          )}

        {!aiLoading &&
          explanation && (
            <>
              {renderEmphasizedText(
                explanation.recommendationReason,
                styles.aiReasonText,
              )}

              <View
                style={
                  styles.chunkList
                }
              >
                {explanation.advantages.map(
                  (
                    advantage,
                    index,
                  ) => (
                    <View
                      key={`adv-${index}`}
                      style={
                        styles.chunkRowGood
                      }
                    >
                      <Text
                        style={
                          styles.chunkIconGood
                        }
                      >
                        ✓
                      </Text>

                      {renderEmphasizedText(
                        advantage,
                        styles.chunkTextGood,
                      )}
                    </View>
                  ),
                )}

                {explanation.risks.map(
                  (
                    risk,
                    index,
                  ) => (
                    <View
                      key={`risk-${index}`}
                      style={
                        styles.chunkRowWarn
                      }
                    >
                      <Text
                        style={
                          styles.chunkIconWarn
                        }
                      >
                        !
                      </Text>

                      {renderEmphasizedText(
                        risk,
                        styles.chunkTextWarn,
                      )}
                    </View>
                  ),
                )}
              </View>

              <TouchableOpacity
                style={
                  styles.detailToggleButton
                }
                activeOpacity={
                  0.7
                }
                onPress={() =>
                  setDetailExpanded(
                    prev =>
                      !prev,
                  )
                }
              >
                <Text
                  style={
                    styles.detailToggleTextAi
                  }
                >
                  {detailExpanded
                    ? 'AI 상세 분석 접기 ▲'
                    : 'AI 상세 분석 더보기 ▼'}
                </Text>
              </TouchableOpacity>

              {detailExpanded && (
                <View
                  style={
                    styles.aiDetailSection
                  }
                >
                  <Text
                    style={
                      styles.aiLabel
                    }
                  >
                    주요 특징
                  </Text>

                  {renderEmphasizedText(
                    explanation.keyFeatures,
                    styles.aiReasonText,
                  )}

                  <Text
                    style={
                      styles.aiLabel
                    }
                  >
                    고려사항
                  </Text>

                  <Text
                    style={
                      styles.aiReasonText
                    }
                  >
                    {
                      explanation.considerations
                    }
                  </Text>
                </View>
              )}
            </>
          )}
      </View>
      </ScrollView>
    </View>
  );
}

/**
 * 네이티브에서만 지도 표시
 */
function NativeStoreMap({
  stores,
}: {
  stores: NearbyStore[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MapView =
    require(
      'react-native-maps',
    ).default;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    Marker,
  } =
    require(
      'react-native-maps',
    );

  const center =
    stores[0];

  return (
    <MapView
      style={
        styles.map
      }
      initialRegion={{
        latitude:
          center.lat,

        longitude:
          center.lng,

        latitudeDelta:
          0.02,

        longitudeDelta:
          0.02,
      }}
    >
      {stores.map(
        (
          store,
          index,
        ) => (
          <Marker
            key={
              index
            }
            coordinate={{
              latitude:
                store.lat,

              longitude:
                store.lng,
            }}
            title={
              store.name
            }
            description={
              store.address
            }
          />
        ),
      )}
    </MapView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      marginLeft: -6,
    },
    backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
    appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    appBarSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

    scroll: { flex: 1 },

    container: {
      padding: 20,

      paddingBottom: 40,
    },

    headerCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,

      borderRadius: 20,

      padding: 20,

      marginBottom: 16,
    },

    headerTopRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,

      marginBottom: 12,
    },

    rankPill: {
      backgroundColor:
        COLORS.primaryLight,

      borderRadius: 12,

      paddingVertical: 4,

      paddingHorizontal: 10,
    },

    rankPillText: {
      color:
        COLORS.primary,

      fontSize: 12,

      fontWeight:
        '800',
    },

    headerSubText: {
      color:
        '#9CA3AF',

      fontSize: 12,
    },

    titleRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      gap: 12,
      marginBottom: 16,
    },

    titleArea: {
      flex: 1,
    },

    headerTitle: {
      color:
        COLORS.text,

      fontSize: 22,

      fontWeight:
        '900',

      marginBottom: 4,
    },

    headerBusiness: {
      color:
        COLORS.textSecondary,

      fontSize: 14,
    },

    pointSubtitle: {
      marginTop: 6,

      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.primary,
    },

    scoreCol: {
      alignItems: 'flex-end',
    },

    scoreValue: {
      color:
        COLORS.primary,

      fontSize: 28,

      fontWeight:
        '900',
    },

    scoreLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 11,
      marginTop: 2,
    },

    favoriteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,

      backgroundColor:
        COLORS.background,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    favoriteButtonActive: {
      backgroundColor:
        '#E54861',

      borderColor:
        '#E54861',
    },

    favoriteText: {
      fontSize: 18,
      lineHeight: 20,

      color:
        '#E54861',
    },

    favoriteTextActive: {
      color:
        '#FFFFFF',
    },

    favoriteLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: COLORS.textSecondary,
    },

    favoriteLabelActive: {
      color: '#FFFFFF',
    },

    metricGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 10,

      marginBottom: 16,
    },

    metricBox: {
      width:
        '47%',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 14,

      padding: 14,
    },

    metricLabel: {
      fontSize: 11,

      color:
        COLORS.textSecondary,

      marginBottom: 6,
    },

    metricValue: {
      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    sectionBox: {
      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      padding: 16,

      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.text,

      marginBottom: 4,
    },

    sectionDescription: {
      fontSize: 12,

      color:
        COLORS.textSecondary,

      marginBottom: 12,
    },

    tabRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },

    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: COLORS.background,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    tabButtonActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },

    tabButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.textSecondary,
    },

    tabButtonTextActive: {
      color: '#FFFFFF',
    },

    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 6,
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
      fontWeight: '600',
    },

    estimateNotice: {
      marginTop: 8,

      marginBottom: 14,

      padding: 10,

      borderRadius: 10,

      backgroundColor:
        COLORS.primaryLight,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },

    map: {
      width:
        '100%',

      height: 200,

      borderRadius: 14,

      marginBottom: 12,
    },

    smallLoadingBox: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,

      paddingVertical: 10,
    },

    smallLoadingText: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    storesError: {
      fontSize: 12,

      color:
        COLORS.danger,
    },

    storesEmpty: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    storeRow: {
      paddingVertical: 10,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    storeName: {
      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    storeAddress: {
      fontSize: 12,

      color:
        COLORS.textSecondary,

      marginTop: 2,
    },

    detailRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      marginBottom: 10,
    },

    detailLabel: {
      fontSize: 13,

      color:
        COLORS.textSecondary,
    },

    detailValue: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    aiSectionBox: {
      backgroundColor: COLORS.aiLight,
      borderWidth: 1,
      borderColor: 'rgba(14,165,233,0.2)',
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },

    aiSectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },

    aiIconBox: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: COLORS.ai,
      alignItems: 'center',
      justifyContent: 'center',
    },

    aiIconText: { fontSize: 13 },

    aiSectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: COLORS.ai,
    },

    aiReasonText: {
      fontSize: 13,

      lineHeight: 20,

      color:
        COLORS.text,
    },

    aiHighlight: {
      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    chunkList: {
      marginTop: 12,

      gap: 8,
    },

    chunkRowGood: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 8,

      backgroundColor:
        COLORS.primaryLight,

      borderRadius: 10,

      padding: 10,
    },

    chunkIconGood: {
      color:
        COLORS.primary,

      fontWeight:
        '900',

      fontSize: 13,
    },

    chunkTextGood: {
      flex: 1,

      fontSize: 12,

      lineHeight: 18,

      color:
        COLORS.primaryDark,
    },

    chunkRowWarn: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 8,

      backgroundColor:
        COLORS.warningLight,

      borderRadius: 10,

      padding: 10,
    },

    chunkIconWarn: {
      color:
        COLORS.warning,

      fontWeight:
        '900',

      fontSize: 13,
    },

    chunkTextWarn: {
      flex: 1,

      fontSize: 12,

      lineHeight: 18,

      color:
        '#7C4A03',
    },

    detailToggleButton: {
      marginTop: 14,

      alignItems:
        'center',
    },

    detailToggleText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    detailToggleTextAi: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.ai,
    },

    aiDetailSection: {
      marginTop: 10,

      paddingTop: 10,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    aiLabel: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.textSecondary,

      marginTop: 8,

      marginBottom: 4,
    },
  });
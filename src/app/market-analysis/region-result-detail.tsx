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

import { useLocalSearchParams } from 'expo-router';

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

export default function RegionResultDetailScreen() {
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

  return (
    <ScrollView
      style={
        styles.screen
      }
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =========================
          HEADER
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
              {rank}위
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

        {/* 지역 이름 + 하트 */}
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
            )}
          </TouchableOpacity>
        </View>

        <Text
          style={
            styles.headerBusiness
          }
        >
          {
            businessName
          }
        </Text>

        <View
          style={
            styles.scoreRow
          }
        >
          <Text
            style={
              styles.scoreLabel
            }
          >
            종합 적합도
          </Text>

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
              styles.scoreUnit
            }
          >
            / 100
          </Text>
        </View>
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
          styles.sectionBox
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          AI 분석 요약
        </Text>

        {aiLoading && (
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
                    styles.detailToggleText
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

    container: {
      padding: 20,

      paddingBottom: 40,
    },

    headerCard: {
      backgroundColor:
        '#111111',

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

      marginBottom: 10,
    },

    rankPill: {
      backgroundColor:
        COLORS.primary,

      borderRadius: 12,

      paddingVertical: 4,

      paddingHorizontal: 10,
    },

    rankPillText: {
      color:
        '#FFFFFF',

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
        'center',

      justifyContent:
        'space-between',

      gap: 12,
    },

    titleArea: {
      flex: 1,
    },

    headerTitle: {
      color:
        '#FFFFFF',

      fontSize: 24,

      fontWeight:
        '900',

      marginBottom: 4,
    },

    pointSubtitle: {
      marginTop: 2,

      fontSize: 11,

      fontWeight:
        '700',

      color:
        '#A7F3D0',
    },

    favoriteButton: {
      width: 44,

      height: 44,

      borderRadius: 22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#E5E7EB',
    },

    favoriteButtonActive: {
      backgroundColor:
        '#E54861',

      borderColor:
        '#E54861',
    },

    favoriteText: {
      fontSize: 27,

      lineHeight: 31,

      color:
        '#E54861',
    },

    favoriteTextActive: {
      color:
        '#FFFFFF',
    },

    headerBusiness: {
      color:
        '#D1D5DB',

      fontSize: 14,

      marginTop: 6,

      marginBottom: 16,
    },

    scoreRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      gap: 6,
    },

    scoreLabel: {
      color:
        '#9CA3AF',

      fontSize: 12,

      marginBottom: 4,
    },

    scoreValue: {
      color:
        COLORS.neonLime,

      fontSize: 30,

      fontWeight:
        '900',
    },

    scoreUnit: {
      color:
        '#9CA3AF',

      fontSize: 13,

      marginBottom: 4,
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

    estimateNotice: {
      marginTop: 8,

      marginBottom: 14,

      padding: 10,

      borderRadius: 10,

      backgroundColor:
        '#F5FCF6',

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
        '#D14343',
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
        '#F1FFF5',

      borderRadius: 10,

      padding: 10,
    },

    chunkIconGood: {
      color:
        '#1B9C4F',

      fontWeight:
        '900',

      fontSize: 13,
    },

    chunkTextGood: {
      flex: 1,

      fontSize: 12,

      lineHeight: 18,

      color:
        '#1B4332',
    },

    chunkRowWarn: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 8,

      backgroundColor:
        '#FFF8E8',

      borderRadius: 10,

      padding: 10,
    },

    chunkIconWarn: {
      color:
        '#B45309',

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
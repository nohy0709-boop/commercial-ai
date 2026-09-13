import {
    AnalysisHistoryItem,
    getFavoriteAnalyses,
    toggleAnalysisFavorite,
} from '@/services/analysisHistory';

import { COLORS } from '@/constants/colors';

import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import React, {
    useCallback,
    useState,
} from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FavoriteAnalysesScreen() {
  const router =
    useRouter();

  const [
    favorites,
    setFavorites,
  ] =
    useState<
      AnalysisHistoryItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const loadFavorites =
    useCallback(async () => {
      try {
        setLoading(
          true,
        );

        const data =
          await getFavoriteAnalyses();

        setFavorites(
          data,
        );
      } catch (error) {
        console.error(
          '찜한 분석 조회 실패:',
          error,
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  const formatDate = (
    dateString: string,
  ) => {
    const date =
      new Date(
        dateString,
      );

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() +
          1,
      ).padStart(
        2,
        '0',
      );

    const day =
      String(
        date.getDate(),
      ).padStart(
        2,
        '0',
      );

    return `${year}.${month}.${day}`;
  };

  const getTypeLabel = (
    type: AnalysisHistoryItem['type'],
  ) => {
    switch (type) {
      case 'comparison':
        return '비교 분석';

      case 'location':
        return '입지 추천';

      case 'owned':
        return '보유 입지 분석';

      default:
        return '분석';
    }
  };

  const handleUnlike =
    async (
      id: string,
    ) => {
      try {
        await toggleAnalysisFavorite(
          id,
        );

        setFavorites(
          prev =>
            prev.filter(
              item =>
                item.id !==
                id,
            ),
        );
      } catch (error) {
        console.error(
          '찜 해제 실패:',
          error,
        );
      }
    };

  const handleView =
    (
      history: AnalysisHistoryItem,
    ) => {
      const data =
        history.resultData;

      if (!data) {
        return;
      }

      router.push({
        pathname:
          '/market-analysis/region-result-detail',

        params: {
          businessName:
            data.businessName ??
            history.businessName,

          areaName:
            data.areaName ??
            history.regions[0] ??
            '',

          rank:
            String(
              data.rank ??
                1,
            ),

          totalCount:
            String(
              data.totalCount ??
                1,
            ),

          suitabilityScore:
            String(
              data.suitabilityScore ??
                0,
            ),

          floatingPopulation:
            String(
              data.floatingPopulation ??
                0,
            ),

          livingPopulation:
            String(
              data.livingPopulation ??
                0,
            ),

          storeCount:
            String(
              data.storeCount ??
                0,
            ),

          competitionDensity:
            String(
              data.competitionDensity ??
                0,
            ),

          salesAmount:
            String(
              data.salesAmount ??
                0,
            ),

          averageSalesPerStore:
            String(
              data.averageSalesPerStore ??
                0,
            ),

          busStopCount:
            String(
              data.busStopCount ??
                0,
            ),

          livingPopulationChangeRate:
            String(
              data.livingPopulationChangeRate ??
                0,
            ),

          floatingPopulationChangeRate:
            String(
              data.floatingPopulationChangeRate ??
                0,
            ),

          analysisType:
            data.analysisType ??
            'area',

          dongName:
            data.dongName ??
            data.areaName ??
            '',

          latitude:
            data.latitude !=
            null
              ? String(
                  data.latitude,
                )
              : '',

          longitude:
            data.longitude !=
            null
              ? String(
                  data.longitude,
                )
              : '',

          radius:
            data.radius !=
            null
              ? String(
                  data.radius,
                )
              : '',
        },
      });
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
      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.title
          }
        >
          찜한 분석
        </Text>

        <Text
          style={
            styles.description
          }
        >
          마음에 든 분석 결과만
          따로 모아볼 수 있어요.
        </Text>
      </View>

      <View
        style={
          styles.countCard
        }
      >
        <Text
          style={
            styles.countNumber
          }
        >
          {
            favorites.length
          }
        </Text>

        <Text
          style={
            styles.countLabel
          }
        >
          저장한 분석
        </Text>
      </View>

      {loading ? (
        <View
          style={
            styles.loadingBox
          }
        >
          <ActivityIndicator
            size="large"
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            찜한 분석을 불러오고 있어요
          </Text>
        </View>
      ) : favorites.length ===
        0 ? (
        <View
          style={
            styles.emptyBox
          }
        >
          <Text
            style={
              styles.emptyIcon
            }
          >
            ♡
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            아직 찜한 분석이 없어요
          </Text>

          <Text
            style={
              styles.emptyDescription
            }
          >
            분석 상세 화면에서
            하트를 누르면 여기에
            저장됩니다.
          </Text>
        </View>
      ) : (
        favorites.map(
          history => (
            <View
              key={
                history.id
              }
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.cardTop
                }
              >
                <View
                  style={
                    styles.typeBadge
                  }
                >
                  <Text
                    style={
                      styles.typeBadgeText
                    }
                  >
                    {getTypeLabel(
                      history.type,
                    )}
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.heartButton
                  }
                  activeOpacity={
                    0.7
                  }
                  onPress={() =>
                    handleUnlike(
                      history.id,
                    )
                  }
                >
                  <Text
                    style={
                      styles.heartText
                    }
                  >
                    ♥
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={
                  styles.businessName
                }
              >
                {
                  history.businessName
                }
              </Text>

              <View
                style={
                  styles.regionRow
                }
              >
                {history.regions.map(
                  (
                    region,
                    index,
                  ) => (
                    <View
                      key={`${region}-${index}`}
                      style={
                        styles.regionChip
                      }
                    >
                      <Text
                        style={
                          styles.regionText
                        }
                      >
                        {
                          region
                        }
                      </Text>
                    </View>
                  ),
                )}
              </View>

              <Text
                style={
                  styles.date
                }
              >
                {formatDate(
                  history.createdAt,
                )}
              </Text>

              <TouchableOpacity
                style={
                  styles.viewButton
                }
                activeOpacity={
                  0.8
                }
                onPress={() =>
                  handleView(
                    history,
                  )
                }
              >
                <Text
                  style={
                    styles.viewButtonText
                  }
                >
                  분석 다시 보기 →
                </Text>
              </TouchableOpacity>
            </View>
          ),
        )
      )}
    </ScrollView>
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
      width:
        '100%',

      maxWidth: 900,

      alignSelf:
        'center',

      padding: 20,

      paddingBottom: 60,
    },

    header: {
      marginTop: 10,

      marginBottom: 20,
    },

    title: {
      fontSize: 28,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    description: {
      marginTop: 6,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.textSecondary,
    },

    countCard: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      gap: 6,

      padding: 18,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        '#F2D8DD',

      backgroundColor:
        '#FFF7F8',

      marginBottom: 20,
    },

    countNumber: {
      fontSize: 28,

      fontWeight:
        '900',

      color:
        '#E54861',
    },

    countLabel: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,

      marginBottom: 4,
    },

    loadingBox: {
      minHeight: 250,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,

      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    emptyBox: {
      minHeight: 260,

      borderRadius: 20,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 20,
    },

    emptyIcon: {
      fontSize: 46,

      color:
        '#E54861',

      marginBottom: 12,
    },

    emptyTitle: {
      fontSize: 16,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    emptyDescription: {
      marginTop: 6,

      fontSize: 12,

      lineHeight: 18,

      textAlign:
        'center',

      color:
        COLORS.textSecondary,
    },

    card: {
      padding: 18,

      marginBottom: 14,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,
    },

    cardTop: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',
    },

    typeBadge: {
      paddingVertical: 6,

      paddingHorizontal: 10,

      borderRadius: 999,

      backgroundColor:
        '#E9F8EC',
    },

    typeBadgeText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    heartButton: {
      width: 38,

      height: 38,

      borderRadius: 19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFF1F3',
    },

    heartText: {
      fontSize: 21,

      color:
        '#E54861',
    },

    businessName: {
      marginTop: 15,

      fontSize: 20,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    regionRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 7,

      marginTop: 12,
    },

    regionChip: {
      paddingVertical: 6,

      paddingHorizontal: 10,

      borderRadius: 999,

      backgroundColor:
        '#F4F5F4',
    },

    regionText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    date: {
      marginTop: 12,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    viewButton: {
      marginTop: 16,

      minHeight: 44,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.neonLime,
    },

    viewButtonText: {
      fontSize: 13,

      fontWeight:
        '900',

      color:
        '#111111',
    },
  });
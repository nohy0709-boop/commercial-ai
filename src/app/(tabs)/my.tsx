import {
    AnalysisHistoryItem,
    deleteAnalysis,
    getAnalysisHistory,
} from '@/services/analysisHistory';

import { COLORS } from '@/constants/colors';

import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import React, {
    useCallback,
    useMemo,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type StartupNeed = {
  businessType: string;

  budget: string;

  preferredAreas: string[];

  priorities: string[];

  targetCustomer: string;

  updatedAt: string;
};

const MOCK_STARTUP_NEED: StartupNeed = {
  businessType: '카페',

  budget: '5,000만원 이하',

  preferredAreas: [
    '나성동',
    '어진동',
  ],

  priorities: [
    '유동인구',
    '매출',
    '경쟁도',
  ],

  targetCustomer:
    '20~30대 직장인',

  updatedAt:
    '2026-09-13',
};

export default function MyScreen() {
  const router =
    useRouter();

  const [
    histories,
    setHistories,
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

  const [
    startupNeed,
  ] =
    useState<StartupNeed>(
      MOCK_STARTUP_NEED,
    );

  const loadHistory =
    useCallback(async () => {
      try {
        setLoading(
          true,
        );

        const data =
          await getAnalysisHistory();

        setHistories(
          data,
        );
      } catch (error) {
        console.error(
          '분석 기록 조회 실패:',
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
      loadHistory();
    }, [loadHistory]),
  );

  const favoriteHistories =
    useMemo(
      () =>
        histories.filter(
          item =>
            item.isFavorite ===
            true,
        ),
      [histories],
    );

  const recentHistories =
    useMemo(
      () =>
        [...histories]
          .sort(
            (
              a,
              b,
            ) =>
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime(),
          )
          .slice(
            0,
            3,
          ),
      [histories],
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

  const handleDelete = (
    id: string,
  ) => {
    Alert.alert(
      '분석 기록 삭제',
      '이 분석 결과를 삭제할까요?',
      [
        {
          text:
            '취소',

          style:
            'cancel',
        },

        {
          text:
            '삭제',

          style:
            'destructive',

          onPress:
            async () => {
              try {
                await deleteAnalysis(
                  id,
                );

                setHistories(
                  prev =>
                    prev.filter(
                      item =>
                        item.id !==
                        id,
                    ),
                );
              } catch (error) {
                console.error(
                  '삭제 실패:',
                  error,
                );

                Alert.alert(
                  '오류',
                  '분석 기록을 삭제하지 못했습니다.',
                );
              }
            },
        },
      ],
    );
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
          MY
        </Text>

        <Text
          style={
            styles.description
          }
        >
          나의 창업 기준과 분석 기록을
          한곳에서 관리해보세요.
        </Text>
      </View>

      <View
        style={
          styles.needCard
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              MY STARTUP
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              나의 창업 니즈
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.editButton
            }
            activeOpacity={
              0.8
            }
            onPress={() => {
              console.log(
                '창업 니즈 수정',
              );
            }}
          >
            <Text
              style={
                styles.editButtonText
              }
            >
              수정
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.needMainRow
          }
        >
          <View
            style={
              styles.needMainItem
            }
          >
            <Text
              style={
                styles.needLabel
              }
            >
              희망 업종
            </Text>

            <Text
              style={
                styles.needValue
              }
            >
              {
                startupNeed.businessType
              }
            </Text>
          </View>

          <View
            style={
              styles.needMainItem
            }
          >
            <Text
              style={
                styles.needLabel
              }
            >
              예산
            </Text>

            <Text
              style={
                styles.needValue
              }
            >
              {
                startupNeed.budget
              }
            </Text>
          </View>
        </View>

        <View
          style={
            styles.needBlock
          }
        >
          <Text
            style={
              styles.needLabel
            }
          >
            선호 지역
          </Text>

          <View
            style={
              styles.chipRow
            }
          >
            {startupNeed.preferredAreas.map(
              area => (
                <View
                  key={
                    area
                  }
                  style={
                    styles.grayChip
                  }
                >
                  <Text
                    style={
                      styles.grayChipText
                    }
                  >
                    {
                      area
                    }
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        <View
          style={
            styles.needBlock
          }
        >
          <Text
            style={
              styles.needLabel
            }
          >
            중요하게 보는 기준
          </Text>

          {startupNeed.priorities.map(
            (
              priority,
              index,
            ) => (
              <View
                key={
                  priority
                }
                style={
                  styles.priorityRow
                }
              >
                <View
                  style={
                    styles.priorityNumber
                  }
                >
                  <Text
                    style={
                      styles.priorityNumberText
                    }
                  >
                    {
                      index +
                      1
                    }
                  </Text>
                </View>

                <Text
                  style={
                    styles.priorityText
                  }
                >
                  {
                    priority
                  }
                </Text>
              </View>
            ),
          )}
        </View>

        <View
          style={
            styles.needBlock
          }
        >
          <Text
            style={
              styles.needLabel
            }
          >
            주요 고객층
          </Text>

          <Text
            style={
              styles.needText
            }
          >
            {
              startupNeed.targetCustomer
            }
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.historyLinkButton
          }
          activeOpacity={
            0.8
          }
          onPress={() => {
            console.log(
              '니즈 변경 내역',
            );
          }}
        >
          <Text
            style={
              styles.historyLinkText
            }
          >
            니즈 변경 내역 보기
          </Text>

          <Text
            style={
              styles.historyLinkArrow
            }
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={
          styles.summaryCard
        }
      >
        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              histories.length
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            전체 분석
          </Text>
        </View>

        <View
          style={
            styles.summaryDivider
          }
        />

        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              favoriteHistories.length
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            찜한 분석
          </Text>
        </View>

        <View
          style={
            styles.summaryDivider
          }
        />

        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {
              histories.filter(
                item =>
                  item.type ===
                  'comparison',
              ).length
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            비교 분석
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={
          styles.menuCard
        }
        activeOpacity={
          0.8
        }
        onPress={() =>
          router.push(
            '/my/favorites',
          )
        }
      >
        <View
          style={
            styles.menuTop
          }
        >
          <View
            style={
              styles.menuIcon
            }
          >
            <Text
              style={
                styles.menuIconText
              }
            >
              ♥
            </Text>
          </View>

          <View
            style={
              styles.menuBody
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              찜한 분석
            </Text>

            <Text
              style={
                styles.menuDescription
              }
            >
              마음에 든 분석 결과를
              따로 모아볼 수 있어요.
            </Text>
          </View>

          <Text
            style={
              styles.menuCount
            }
          >
            {
              favoriteHistories.length
            }
          </Text>

          <Text
            style={
              styles.menuArrow
            }
          >
            ›
          </Text>
        </View>
      </TouchableOpacity>

      <View
        style={
          styles.sectionHeader
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          최근 분석
        </Text>

        <Text
          style={
            styles.historyCount
          }
        >
          {histories.length}개
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
            분석 기록을 불러오고 있어요
          </Text>
        </View>
      ) : recentHistories.length ===
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
            📊
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            아직 분석 기록이 없어요
          </Text>

          <Text
            style={
              styles.emptyDescription
            }
          >
            분석 상세 화면에서 하트를
            누르거나 결과를 저장하면
            여기에 표시됩니다.
          </Text>
        </View>
      ) : (
        recentHistories.map(
          history => (
            <View
              key={
                history.id
              }
              style={
                styles.historyCard
              }
            >
              <View
                style={
                  styles.cardHeader
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

                <View
                  style={
                    styles.dateRow
                  }
                >
                  {history.isFavorite && (
                    <Text
                      style={
                        styles.favoriteIcon
                      }
                    >
                      ♥
                    </Text>
                  )}

                  <Text
                    style={
                      styles.date
                    }
                  >
                    {formatDate(
                      history.createdAt,
                    )}
                  </Text>
                </View>
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

              <View
                style={
                  styles.cardFooter
                }
              >
                <TouchableOpacity
                  style={
                    styles.deleteButton
                  }
                  activeOpacity={
                    0.7
                  }
                  onPress={() =>
                    handleDelete(
                      history.id,
                    )
                  }
                >
                  <Text
                    style={
                      styles.deleteText
                    }
                  >
                    삭제
                  </Text>
                </TouchableOpacity>

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
                    다시 보기 →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
        )
      )}

      <TouchableOpacity
        style={
          styles.bottomMenuCard
        }
        activeOpacity={
          0.8
        }
        onPress={() => {
          console.log(
            '니즈 변경 내역',
          );
        }}
      >
        <View>
          <Text
            style={
              styles.bottomMenuTitle
            }
          >
            니즈 변경 내역
          </Text>

          <Text
            style={
              styles.bottomMenuDescription
            }
          >
            창업 기준을 어떻게 변경해왔는지
            확인할 수 있어요.
          </Text>
        </View>

        <Text
          style={
            styles.menuArrow
          }
        >
          ›
        </Text>
      </TouchableOpacity>
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
      width: '100%',

      maxWidth: 900,

      alignSelf:
        'center',

      padding: 20,

      paddingBottom: 60,
    },

    header: {
      marginTop: 10,

      marginBottom: 24,
    },

    title: {
      fontSize: 30,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    description: {
      marginTop: 7,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.textSecondary,
    },

    sectionHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 14,
    },

    sectionEyebrow: {
      fontSize: 10,

      fontWeight:
        '800',

      color:
        COLORS.primary,

      marginBottom: 4,
    },

    sectionTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    needCard: {
      padding: 20,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        '#DCEFE0',

      backgroundColor:
        '#F7FCF8',

      marginBottom: 18,
    },

    editButton: {
      paddingVertical: 7,

      paddingHorizontal: 13,

      borderRadius: 999,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    editButtonText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    needMainRow: {
      flexDirection:
        'row',

      gap: 10,

      marginTop: 8,
    },

    needMainItem: {
      flex: 1,

      padding: 14,

      borderRadius: 14,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#E7EFE9',
    },

    needLabel: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,

      marginBottom: 7,
    },

    needValue: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    needBlock: {
      marginTop: 18,
    },

    needText: {
      fontSize: 14,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    chipRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 7,
    },

    grayChip: {
      paddingVertical: 6,

      paddingHorizontal: 10,

      borderRadius: 999,

      backgroundColor:
        '#EEF1EF',
    },

    grayChipText: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    priorityRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 7,
    },

    priorityNumber: {
      width: 24,

      height: 24,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primary,

      marginRight: 9,
    },

    priorityNumberText: {
      color:
        '#FFFFFF',

      fontSize: 11,

      fontWeight:
        '900',
    },

    priorityText: {
      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.text,
    },

    historyLinkButton: {
      marginTop: 20,

      paddingTop: 16,

      borderTopWidth: 1,

      borderTopColor:
        '#E4EEE6',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    historyLinkText: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    historyLinkArrow: {
      fontSize: 20,

      color:
        COLORS.primary,
    },

    summaryCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical: 20,

      borderRadius: 20,

      borderWidth: 1,

      borderColor:
        '#DCEFE0',

      backgroundColor:
        '#F5FCF6',

      marginBottom: 18,
    },

    summaryItem: {
      flex: 1,

      alignItems:
        'center',
    },

    summaryNumber: {
      fontSize: 24,

      fontWeight:
        '900',

      color:
        COLORS.primary,

      marginBottom: 5,
    },

    summaryLabel: {
      fontSize: 11,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    summaryDivider: {
      width: 1,

      height: 36,

      backgroundColor:
        '#DCEFE0',
    },

    menuCard: {
      padding: 17,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      marginBottom: 28,
    },

    menuTop: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    menuIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFF1F3',

      marginRight: 13,
    },

    menuIconText: {
      fontSize: 20,

      color:
        '#E54861',
    },

    menuBody: {
      flex: 1,
    },

    menuTitle: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    menuDescription: {
      marginTop: 3,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },

    menuCount: {
      fontSize: 16,

      fontWeight:
        '900',

      color:
        COLORS.primary,

      marginRight: 8,
    },

    menuArrow: {
      fontSize: 24,

      color:
        COLORS.textSecondary,
    },

    historyCount: {
      fontSize: 12,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    loadingBox: {
      minHeight: 220,

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

    historyCard: {
      padding: 18,

      marginBottom: 14,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,
    },

    cardHeader: {
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

    dateRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,
    },

    favoriteIcon: {
      fontSize: 13,

      color:
        '#E54861',
    },

    date: {
      fontSize: 11,

      color:
        COLORS.textSecondary,
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

      marginTop: 13,
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

    cardFooter: {
      flexDirection:
        'row',

      gap: 9,

      marginTop: 18,

      paddingTop: 15,

      borderTopWidth: 1,

      borderTopColor:
        '#EEEEEE',
    },

    deleteButton: {
      minWidth: 70,

      minHeight: 43,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',
    },

    deleteText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,
    },

    viewButton: {
      flex: 1,

      minHeight: 43,

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

    emptyBox: {
      minHeight: 230,

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

      marginBottom: 20,
    },

    emptyIcon: {
      fontSize: 36,

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

    bottomMenuCard: {
      marginTop: 8,

      padding: 18,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    bottomMenuTitle: {
      fontSize: 15,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    bottomMenuDescription: {
      marginTop: 5,

      fontSize: 11,

      lineHeight: 17,

      color:
        COLORS.textSecondary,
    },
  });
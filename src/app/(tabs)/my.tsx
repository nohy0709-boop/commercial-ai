import {
    AnalysisHistoryItem,
    deleteAnalysis,
    getAnalysisHistory,
} from '@/services/analysisHistory';

import { COLORS } from '@/constants/colors';

import { useFocusEffect } from 'expo-router';

import React, {
    useCallback,
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

export default function MyScreen() {
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
  ] = useState(true);

  /**
   * MY 탭에 들어올 때마다
   * 저장된 분석 기록 다시 불러오기
   */
  const loadHistory =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await getAnalysisHistory();

        setHistories(data);
      } catch (error) {
        console.error(
          '분석 기록 조회 실패:',
          error,
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  /**
   * 분석 타입 이름
   */
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

  /**
   * 분석 타입 설명
   */
  const getTypeDescription = (
    type: AnalysisHistoryItem['type'],
  ) => {
    switch (type) {
      case 'comparison':
        return '업종 + 입지 적합성 분석';

      case 'location':
        return '업종 기반 입지 추천';

      case 'owned':
        return '보유 입지 기반 업종 추천';

      default:
        return '';
    }
  };

  /**
   * 날짜 표시
   */
  const formatDate = (
    dateString: string,
  ) => {
    const date =
      new Date(dateString);

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1,
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

  /**
   * 삭제
   */
  const handleDelete = (
    id: string,
  ) => {
    Alert.alert(
      '분석 기록 삭제',
      '이 분석 결과를 삭제할까요?',
      [
        {
          text: '취소',
          style: 'cancel',
        },

        {
          text: '삭제',
          style:
            'destructive',

          onPress: async () => {
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
      {/* HEADER */}

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
          저장한 상권 분석 결과를 한곳에서
          확인할 수 있어요.
        </Text>
      </View>

      {/* SUMMARY */}

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
            저장한 분석
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
                  item.type !==
                  'comparison',
              ).length
            }
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            추천 기록
          </Text>
        </View>
      </View>

      {/* TITLE */}

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
          내 분석 기록
        </Text>

        <Text
          style={
            styles.historyCount
          }
        >
          {histories.length}개
        </Text>
      </View>

      {/* LOADING */}

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
            저장된 분석을 불러오고 있어요
          </Text>
        </View>
      ) : histories.length ===
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
            저장한 분석이 없어요
          </Text>

          <Text
            style={
              styles.emptyDescription
            }
          >
            분석 결과 화면에서 저장하면
            여기에 표시됩니다.
          </Text>
        </View>
      ) : (
        histories.map(
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

              <Text
                style={
                  styles.analysisType
                }
              >
                {getTypeDescription(
                  history.type,
                )}
              </Text>

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
                  onPress={() => {
                    console.log(
                      '다시 보기:',
                      history,
                    );
                  }}
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
      alignSelf: 'center',
      padding: 20,
      paddingBottom: 50,
    },

    header: {
      marginTop: 10,
      marginBottom: 24,
    },

    title: {
      fontSize: 30,
      fontWeight: '900',
      color: COLORS.text,
    },

    description: {
      marginTop: 7,
      fontSize: 14,
      lineHeight: 21,
      color:
        COLORS.textSecondary,
    },

    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#DCEFE0',
      backgroundColor:
        '#F5FCF6',
      marginBottom: 28,
    },

    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },

    summaryNumber: {
      fontSize: 24,
      fontWeight: '900',
      color:
        COLORS.primary,
      marginBottom: 5,
    },

    summaryLabel: {
      fontSize: 11,
      fontWeight: '700',
      color:
        COLORS.textSecondary,
    },

    summaryDivider: {
      width: 1,
      height: 36,
      backgroundColor:
        '#DCEFE0',
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: COLORS.text,
    },

    historyCount: {
      fontSize: 12,
      fontWeight: '800',
      color:
        COLORS.primary,
    },

    loadingBox: {
      minHeight: 250,
      alignItems: 'center',
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
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
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
      fontWeight: '800',
      color:
        COLORS.primary,
    },

    date: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    analysisType: {
      marginTop: 16,
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    businessName: {
      marginTop: 5,
      fontSize: 20,
      fontWeight: '900',
      color: COLORS.text,
    },

    regionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
      fontWeight: '700',
      color:
        COLORS.textSecondary,
    },

    cardFooter: {
      flexDirection: 'row',
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
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#FFFFFF',
    },

    deleteText: {
      fontSize: 12,
      fontWeight: '700',
      color:
        COLORS.textSecondary,
    },

    viewButton: {
      flex: 1,
      minHeight: 43,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.neonLime,
    },

    viewButtonText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#111111',
    },

    emptyBox: {
      minHeight: 260,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.surface,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptyIcon: {
      fontSize: 36,
      marginBottom: 12,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: COLORS.text,
    },

    emptyDescription: {
      marginTop: 6,
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },
  });
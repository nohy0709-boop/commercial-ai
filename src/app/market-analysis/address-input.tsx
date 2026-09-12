import AddressMap from '@/components/address-map.web';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { Coordinates } from '@/services/geocoding';
import {
  getDongFromCoords,
  searchLocation,
} from '@/services/geocoding';

import { useRouter } from 'expo-router';

import React, { useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function AddressInputScreen() {
  const router = useRouter();

  const [address, setAddress] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [coords, setCoords] =
    useState<Coordinates | null>(
      null,
    );

  const [
    matchedDong,
    setMatchedDong,
  ] =
    useState<string | null>(
      null,
    );

  /**
   * 주소 / 건물명 검색
   */
  const handleSearch =
    async () => {
      Keyboard.dismiss();

      const query =
        address.trim();

      if (!query) {
        setErrorMessage(
          '주소 또는 장소명을 입력해주세요.',
        );

        return;
      }

      try {
        setLoading(true);

        setErrorMessage('');
        setMatchedDong(null);
        setCoords(null);

        /**
         * 사용자가 "나성동 주민센터"처럼
         * 세종을 생략한 경우 자동으로 붙임
         */
        let searchQuery =
          query;

        if (
          !query.includes(
            '세종',
          )
        ) {
          searchQuery =
            `세종특별자치시 ${query}`;
        }

        /**
         * 주소 검색 → 실패하면
         * 키워드 검색
         */
        const location =
          await searchLocation(
            searchQuery,
          );

        if (!location) {
          setErrorMessage(
            '위치를 찾을 수 없습니다. 주소나 건물명을 다시 확인해주세요.',
          );

          return;
        }

        /**
         * 좌표 저장
         * → 지도에 표시
         */
        setCoords(location);

        /**
         * 좌표 → 행정동
         */
        const region =
          await getDongFromCoords(
            location.lat,
            location.lng,
          );

        if (!region) {
          setErrorMessage(
            '행정동 정보를 확인할 수 없습니다.',
          );

          return;
        }

        /**
         * 프로젝트에서 지원하는
         * 세종시 동인지 확인
         */
        const known =
          sejongAreas.find(
            area =>
              area.name ===
              region.dongName,
          );

        if (!known) {
          setErrorMessage(
            `'${region.dongName}'은(는) 아직 데이터가 준비된 지역이 아니에요.`,
          );

          return;
        }

        setMatchedDong(
          known.name,
        );
      } catch (error) {
        console.error(
          '주소 검색 오류:',
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : '위치 검색 중 오류가 발생했습니다.',
        );
      } finally {
        setLoading(false);
      }
    };

  /**
   * 분석 결과로 이동
   */
  const handleUseThisLocation =
    () => {
      if (
        !matchedDong ||
        !coords
      ) {
        return;
      }

      router.push({
        pathname:
          '/market-analysis/location-recommend-result',

        params: {
          region:
            matchedDong,

          // 나중에 세부 분석용으로 사용할 수 있게
          // 실제 좌표도 같이 전달
          latitude:
            String(coords.lat),

          longitude:
            String(coords.lng),

          address:
            address.trim(),
        },
      });
    };

  return (
    <TouchableWithoutFeedback
      onPress={
        Keyboard.dismiss
      }
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.content}
        >
          {/* HEADER */}

          <View
            style={
              styles.headerSection
            }
          >
            <Text
              style={
                styles.category
              }
            >
              장기 상권 분석
            </Text>

            <Text
              style={
                styles.header
              }
            >
              보유 장소 입력
            </Text>

            <Text
              style={
                styles.description
              }
            >
              보유한 장소의 주소나 건물명을
              검색하면 지도에서 위치를
              확인할 수 있어요.
            </Text>

            <View
              style={
                styles.accentLine
              }
            />
          </View>

          {/* STEP 1 */}

          <View
            style={
              styles.section
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.stepBadge
                }
              >
                <Text
                  style={
                    styles.stepBadgeText
                  }
                >
                  1
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  장소 검색
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  주소 또는 건물명을 입력해주세요
                </Text>
              </View>
            </View>

            <View
              style={
                styles.searchRow
              }
            >
              <TextInput
                style={
                  styles.input
                }
                value={
                  address
                }
                onChangeText={
                  setAddress
                }
                placeholder="예: 정부세종청사, 나성동 주민센터"
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
                onSubmitEditing={
                  handleSearch
                }
              />

              <TouchableOpacity
                style={
                  styles.searchButton
                }
                activeOpacity={
                  0.8
                }
                onPress={
                  handleSearch
                }
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.searchButtonText
                    }
                  >
                    검색
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {!!errorMessage && (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.error
                  }
                >
                  {
                    errorMessage
                  }
                </Text>
              </View>
            )}
          </View>

          {/* STEP 2 */}

          {coords && (
            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <View
                  style={
                    styles.stepBadge
                  }
                >
                  <Text
                    style={
                      styles.stepBadgeText
                    }
                  >
                    2
                  </Text>
                </View>

                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    위치 확인
                  </Text>

                  <Text
                    style={
                      styles.sectionDescription
                    }
                  >
                    검색한 위치가 맞는지 지도에서
                    확인해주세요
                  </Text>
                </View>
              </View>

              {/* 실제 Kakao 지도 */}

              <View
                style={
                  styles.mapCard
                }
              >
                <AddressMap
                  latitude={
                    coords.lat
                  }
                  longitude={
                    coords.lng
                  }
                  markers={[
                    {
                      name:
                        matchedDong ??
                        address,

                      latitude:
                        coords.lat,

                      longitude:
                        coords.lng,
                    },
                  ]}
                />
              </View>

              {matchedDong && (
                <View
                  style={
                    styles.locationInfo
                  }
                >
                  <View
                    style={
                      styles.locationTop
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.locationLabel
                        }
                      >
                        검색한 장소
                      </Text>

                      <Text
                        style={
                          styles.locationName
                        }
                      >
                        📍 {address}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.dongBadge
                      }
                    >
                      <Text
                        style={
                          styles.dongBadgeText
                        }
                      >
                        {
                          matchedDong
                        }
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.locationDescription
                    }
                  >
                    해당 위치는 세종특별자치시{' '}
                    {matchedDong}으로 인식되었습니다.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* STEP 3 */}

          {matchedDong &&
            coords && (
              <View
                style={
                  styles.resultBox
                }
              >
                <View
                  style={
                    styles.resultHeader
                  }
                >
                  <View
                    style={
                      styles.stepBadge
                    }
                  >
                    <Text
                      style={
                        styles.stepBadgeText
                      }
                    >
                      3
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.resultTitle
                      }
                    >
                      분석 위치 확인
                    </Text>

                    <Text
                      style={
                        styles.resultDescription
                      }
                    >
                      이 위치에 어울리는 업종을
                      추천해드릴게요
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.selectedLocation
                  }
                >
                  <Text
                    style={
                      styles.selectedLocationLabel
                    }
                  >
                    선택한 지역
                  </Text>

                  <Text
                    style={
                      styles.selectedLocationValue
                    }
                  >
                    {
                      matchedDong
                    }
                  </Text>
                </View>

                <TouchableOpacity
                  style={
                    styles.analyzeButton
                  }
                  activeOpacity={
                    0.8
                  }
                  onPress={
                    handleUseThisLocation
                  }
                >
                  <Text
                    style={
                      styles.analyzeButtonText
                    }
                  >
                    이 위치로 업종 추천받기 →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    scrollContent: {
      width: '100%',

      alignItems:
        'center',

      padding: 20,

      paddingBottom:
        50,
    },

    content: {
      width: '100%',

      maxWidth: 900,
    },

    headerSection: {
      marginTop: 12,

      marginBottom:
        24,
    },

    category: {
      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.primary,

      marginBottom:
        6,
    },

    header: {
      fontSize: 27,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    description: {
      marginTop: 8,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.textSecondary,
    },

    accentLine: {
      width: 34,

      height: 4,

      borderRadius:
        2,

      backgroundColor:
        COLORS.primary,

      marginTop:
        14,
    },

    section: {
      padding: 20,

      marginBottom:
        16,

      borderRadius:
        20,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,
    },

    sectionHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      marginBottom:
        18,
    },

    stepBadge: {
      width: 30,

      height: 30,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.primary,

      marginRight:
        11,
    },

    stepBadgeText: {
      fontSize: 14,

      fontWeight:
        '900',

      color:
        '#FFFFFF',
    },

    sectionTitle: {
      fontSize: 18,

      fontWeight:
        '900',

      color:
        COLORS.text,

      marginBottom:
        4,
    },

    sectionDescription: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    searchRow: {
      flexDirection:
        'row',

      gap: 8,
    },

    input: {
      flex: 1,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius:
        12,

      backgroundColor:
        '#FFFFFF',

      paddingHorizontal:
        14,

      paddingVertical:
        12,

      fontSize: 14,

      color:
        COLORS.text,
    },

    searchButton: {
      minWidth: 80,

      backgroundColor:
        COLORS.primary,

      borderRadius:
        12,

      paddingHorizontal:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    searchButtonText: {
      color:
        '#FFFFFF',

      fontWeight:
        '800',

      fontSize: 14,
    },

    errorBox: {
      marginTop: 14,

      padding: 14,

      borderRadius:
        12,

      backgroundColor:
        '#FFF5F5',

      borderWidth: 1,

      borderColor:
        '#FFDADA',
    },

    error: {
      color:
        '#D14343',

      fontSize: 13,
    },

    mapCard: {
      height: 330,

      borderRadius:
        16,

      overflow:
        'hidden',

      backgroundColor:
        '#F4F7F4',
    },

    locationInfo: {
      marginTop: 16,

      padding: 16,

      borderRadius:
        14,

      borderWidth: 1,

      borderColor:
        '#DCEFE0',

      backgroundColor:
        '#FAFFFB',
    },

    locationTop: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',
    },

    locationLabel: {
      fontSize: 11,

      color:
        COLORS.textSecondary,

      marginBottom:
        5,
    },

    locationName: {
      fontSize: 16,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    dongBadge: {
      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        999,

      backgroundColor:
        '#E9F8EC',
    },

    dongBadgeText: {
      fontSize: 11,

      fontWeight:
        '800',

      color:
        COLORS.primary,
    },

    locationDescription: {
      marginTop: 12,

      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    resultBox: {
      padding: 20,

      borderRadius:
        20,

      borderWidth: 1,

      borderColor:
        '#D8F5E2',

      backgroundColor:
        '#F5FCF6',
    },

    resultHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      marginBottom:
        17,
    },

    resultTitle: {
      fontSize: 16,

      fontWeight:
        '900',

      color:
        COLORS.text,

      marginBottom:
        4,
    },

    resultDescription: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    selectedLocation: {
      marginBottom:
        16,

      padding: 14,

      borderRadius:
        14,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#E5EDE6',
    },

    selectedLocationLabel: {
      fontSize: 11,

      color:
        COLORS.textSecondary,

      marginBottom:
        5,
    },

    selectedLocationValue: {
      fontSize: 17,

      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    analyzeButton: {
      width: '100%',

      backgroundColor:
        COLORS.neonLime,

      borderRadius:
        14,

      paddingVertical:
        16,

      alignItems:
        'center',
    },

    analyzeButtonText: {
      color:
        '#111111',

      fontWeight:
        '900',

      fontSize: 15,
    },
  });
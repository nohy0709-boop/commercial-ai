import AddressMap from '@/components/address-map';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { Coordinates } from '@/services/geocoding';

import {
  getDongFromCoords,
  searchLocation,
} from '@/services/geocoding';

import {
  getCurrentLocation,
} from '@/services/currentLocation';

import { useRouter } from 'expo-router';

import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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
    currentLocationLoading,
    setCurrentLocationLoading,
  ] = useState(false);

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
  ] = useState<string | null>(
    null,
  );

  const [
    locationAccuracy,
    setLocationAccuracy,
  ] = useState<number | null>(
    null,
  );

  /**
   * 주소 / 건물명 검색
   */
  const handleSearch = async () => {
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
      setLocationAccuracy(null);

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
       * 주소 검색
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
       *
       * 실제 세부 상권 분석에서는
       * 이 좌표가 핵심 기준이 됨.
       */
      setCoords(location);

      /**
       * 좌표 → 행정동
       *
       * 행정동은 데이터 연결용으로 사용하고,
       * 실제 분석 위치는 위/경도를 유지한다.
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
   * 현재 GPS 위치 사용
   */
  const handleCurrentLocation =
    async () => {
      Keyboard.dismiss();

      try {
        setCurrentLocationLoading(
          true,
        );

        setErrorMessage('');
        setMatchedDong(null);
        setCoords(null);
        setLocationAccuracy(null);

        /**
         * GPS 좌표 획득
         */
        const current =
          await getCurrentLocation();

        /**
         * 기존 프로젝트 좌표 타입에 맞춰 저장
         */
        const location: Coordinates = {
          lat:
            current.latitude,

          lng:
            current.longitude,
        };

        setCoords(
          location,
        );

        setLocationAccuracy(
          current.accuracy,
        );

        /**
         * 현재 좌표 → 행정동
         */
        const region =
          await getDongFromCoords(
            current.latitude,
            current.longitude,
          );

        if (!region) {
          setCoords(null);

          setErrorMessage(
            '현재 위치의 행정동 정보를 확인할 수 없습니다.',
          );

          return;
        }

        /**
         * 현재 프로젝트가 지원하는
         * 세종시 지역인지 확인
         */
        const known =
          sejongAreas.find(
            area =>
              area.name ===
              region.dongName,
          );

        if (!known) {
          setCoords(null);

          setErrorMessage(
            `현재 위치인 '${region.dongName}'은(는) 아직 데이터가 준비된 지역이 아니에요.`,
          );

          return;
        }

        setMatchedDong(
          known.name,
        );

        /**
         * 화면 표시용 텍스트
         *
         * 실제 분석에는 이 문자열이 아니라
         * 위도 / 경도가 전달됨.
         */
        setAddress(
          `현재 위치 · ${known.name}`,
        );

        console.log(
          '현재 GPS 위치:',
          {
            latitude:
              current.latitude,

            longitude:
              current.longitude,

            accuracy:
              current.accuracy,

            dong:
              known.name,
          },
        );
      } catch (error) {
        console.error(
          '현재 위치 확인 오류:',
          error,
        );

        if (
          error instanceof Error &&
          error.message ===
            'LOCATION_PERMISSION_DENIED'
        ) {
          Alert.alert(
            '위치 권한이 필요해요',
            '현재 위치 기반 상권 탐색을 사용하려면 위치 권한을 허용해주세요.',
          );

          return;
        }

        setErrorMessage(
          '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.',
        );
      } finally {
        setCurrentLocationLoading(
          false,
        );
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
          /**
           * 현재는 기존 분석 데이터 연결을 위해
           * 행정동도 함께 전달
           */
          region:
            matchedDong,

          /**
           * 실제 세부 위치 분석의 핵심 데이터
           */
          latitude:
            String(
              coords.lat,
            ),

          longitude:
            String(
              coords.lng,
            ),

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
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.content
          }
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
              주소나 건물명을 검색하거나
              현재 위치를 사용해 세부 위치를
              기준으로 상권을 분석할 수 있어요.
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

              <View
                style={
                  styles.sectionHeaderText
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  장소 선택
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  주소를 검색하거나 현재 위치를
                  사용할 수 있어요
                </Text>
              </View>
            </View>

            {/* 현재 위치 버튼 */}

            <TouchableOpacity
              style={[
                styles.currentLocationButton,

                currentLocationLoading &&
                  styles.disabledButton,
              ]}
              activeOpacity={
                0.8
              }
              onPress={
                handleCurrentLocation
              }
              disabled={
                currentLocationLoading
              }
            >
              {currentLocationLoading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.currentLocationButtonText
                    }
                  >
                    현재 위치 확인 중...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.currentLocationIcon
                    }
                  >
                    📍
                  </Text>

                  <View
                    style={
                      styles.currentLocationTextBox
                    }
                  >
                    <Text
                      style={
                        styles.currentLocationButtonText
                      }
                    >
                      내 현재 위치 사용
                    </Text>

                    <Text
                      style={
                        styles.currentLocationDescription
                      }
                    >
                      GPS를 이용해 현재 위치를
                      정확하게 확인해요
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View
              style={
                styles.orRow
              }
            >
              <View
                style={
                  styles.orLine
                }
              />

              <Text
                style={
                  styles.orText
                }
              >
                또는
              </Text>

              <View
                style={
                  styles.orLine
                }
              />
            </View>

            {/* 주소 검색 */}

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
                disabled={
                  loading
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

                <View
                  style={
                    styles.sectionHeaderText
                  }
                >
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
                    선택한 위치가 맞는지 지도에서
                    확인해주세요
                  </Text>
                </View>
              </View>

              {/* 지도 */}

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
                    <View
                      style={
                        styles.locationTextBox
                      }
                    >
                      <Text
                        style={
                          styles.locationLabel
                        }
                      >
                        선택한 장소
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
                    해당 좌표는 세종특별자치시{' '}
                    {matchedDong}으로 인식되었습니다.
                  </Text>

                  <View
                    style={
                      styles.coordinateBox
                    }
                  >
                    <Text
                      style={
                        styles.coordinateLabel
                      }
                    >
                      세부 분석 좌표
                    </Text>

                    <Text
                      style={
                        styles.coordinateText
                      }
                    >
                      위도{' '}
                      {
                        coords.lat.toFixed(
                          6,
                        )
                      }
                      {'  ·  '}
                      경도{' '}
                      {
                        coords.lng.toFixed(
                          6,
                        )
                      }
                    </Text>

                    {locationAccuracy !==
                      null && (
                      <Text
                        style={
                          styles.accuracyText
                        }
                      >
                        GPS 위치 정확도 약{' '}
                        {Math.round(
                          locationAccuracy,
                        )}
                        m
                      </Text>
                    )}
                  </View>
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

                  <View
                    style={
                      styles.sectionHeaderText
                    }
                  >
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
                      이 좌표를 기준으로 세부 상권
                      데이터를 분석해요
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
                    기준 행정동
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

                  <Text
                    style={
                      styles.selectedCoordinate
                    }
                  >
                    {coords.lat.toFixed(
                      6,
                    )}
                    ,{' '}
                    {coords.lng.toFixed(
                      6,
                    )}
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

    sectionHeaderText: {
      flex: 1,
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

    currentLocationButton: {
      width: '100%',

      minHeight: 72,

      borderRadius:
        14,

      borderWidth: 1,

      borderColor:
        '#CFE9D6',

      backgroundColor:
        '#F7FFF9',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        16,

      paddingVertical:
        13,

      gap: 12,
    },

    disabledButton: {
      opacity: 0.65,
    },

    currentLocationIcon: {
      fontSize: 24,
    },

    currentLocationTextBox: {
      flex: 1,
    },

    currentLocationButtonText: {
      fontSize: 14,

      fontWeight:
        '900',

      color:
        COLORS.primary,
    },

    currentLocationDescription: {
      marginTop: 3,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    orRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginVertical:
        16,

      gap: 10,
    },

    orLine: {
      flex: 1,

      height: 1,

      backgroundColor:
        COLORS.border,
    },

    orText: {
      fontSize: 11,

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

      gap: 10,
    },

    locationTextBox: {
      flex: 1,
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

    coordinateBox: {
      marginTop: 12,

      padding: 12,

      borderRadius:
        10,

      backgroundColor:
        '#FFFFFF',
    },

    coordinateLabel: {
      fontSize: 10,

      fontWeight:
        '700',

      color:
        COLORS.textSecondary,

      marginBottom:
        4,
    },

    coordinateText: {
      fontSize: 12,

      fontWeight:
        '700',

      color:
        COLORS.text,
    },

    accuracyText: {
      marginTop: 4,

      fontSize: 10,

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

    selectedCoordinate: {
      marginTop: 5,

      fontSize: 11,

      color:
        COLORS.textSecondary,
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
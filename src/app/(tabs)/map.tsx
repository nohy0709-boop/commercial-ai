import AddressMap from '@/components/address-map';
import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import { getCurrentLocation } from '@/services/currentLocation';
import {
    Coordinates,
    getDongFromCoords,
} from '@/services/geocoding';

import { useRouter } from 'expo-router';

import {
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
    useWindowDimensions,
    View,
} from 'react-native';

type Radius = 300 | 500 | 1000;

export default function MapScreen() {
  const router = useRouter();

  const { width } =
    useWindowDimensions();

  const isSmallScreen =
    width < 900;

  /**
   * 세종시 기본 중심 좌표
   */
  const SEJONG_CENTER = {
    latitude: 36.48,
    longitude: 127.289,
  };

  /**
   * 지도 중심
   */
  const [
    mapCenter,
    setMapCenter,
  ] = useState({
    latitude:
      SEJONG_CENTER.latitude,

    longitude:
      SEJONG_CENTER.longitude,
  });

  /**
   * 선택 위치
   */
  const [
    selectedPoint,
    setSelectedPoint,
  ] =
    useState<Coordinates | null>(
      null,
    );

  const [
    selectedDong,
    setSelectedDong,
  ] = useState('');

  const [
    selectedLabel,
    setSelectedLabel,
  ] = useState('');

  /**
   * 현재 위치
   */
  const [
    currentLocationLoading,
    setCurrentLocationLoading,
  ] = useState(false);

  const [
    currentLocationAccuracy,
    setCurrentLocationAccuracy,
  ] =
    useState<number | null>(
      null,
    );

  /**
   * 지도 클릭 후
   * 행정동 확인 중
   */
  const [
    pointLoading,
    setPointLoading,
  ] = useState(false);

  /**
   * 분석 반경
   */
  const [
    selectedRadius,
    setSelectedRadius,
  ] =
    useState<Radius>(500);

  /**
   * 분석 업종
   */
  const [
    selectedBusiness,
    setSelectedBusiness,
  ] = useState('');

  /**
   * 전체 업종 목록
   */
  const allBusinesses =
    useMemo(
      () =>
        businessCategories.flatMap(
          category =>
            category.businesses,
        ),
      [],
    );

  const radiusOptions: {
    value: Radius;
    label: string;
  }[] = [
    {
      value: 300,
      label: '300m',
    },
    {
      value: 500,
      label: '500m',
    },
    {
      value: 1000,
      label: '1km',
    },
  ];

  /**
   * =====================================================
   * 지도 클릭
   * =====================================================
   */
  const handleMapPress =
    useCallback(
      async (
        latitude: number,
        longitude: number,
      ) => {
        console.log(
          '지도 클릭:',
          latitude,
          longitude,
        );

        const point: Coordinates = {
          lat: latitude,
          lng: longitude,
        };

        /**
         * 좌표는 클릭 즉시 저장
         */
        setSelectedPoint(
          point,
        );

        setSelectedDong('');

        setSelectedLabel(
          '선택한 위치',
        );

        /**
         * 지도에서 직접 선택했으므로
         * GPS 정확도 제거
         */
        setCurrentLocationAccuracy(
          null,
        );

        /**
         * 지도 중심 이동
         */
        setMapCenter({
          latitude,
          longitude,
        });

        try {
          setPointLoading(true);

          /**
           * 좌표 -> 행정동
           */
          const dong =
            await getDongFromCoords(
              latitude,
              longitude,
            );

          if (!dong) {
            return;
          }

          setSelectedDong(
            dong.dongName,
          );

          setSelectedLabel(
            `${dong.dongName} 내 선택 위치`,
          );
        } catch (error) {
          console.error(
            '행정동 확인 실패:',
            error,
          );
        } finally {
          setPointLoading(
            false,
          );
        }
      },
      [],
    );

  /**
   * =====================================================
   * 현재 위치
   * =====================================================
   */
  const handleCurrentLocation =
    async () => {
      try {
        setCurrentLocationLoading(
          true,
        );

        const current =
          await getCurrentLocation();

        const point: Coordinates = {
          lat:
            current.latitude,

          lng:
            current.longitude,
        };

        setSelectedPoint(
          point,
        );

        setSelectedDong('');

        setSelectedLabel(
          '현재 위치',
        );

        setCurrentLocationAccuracy(
          current.accuracy,
        );

        /**
         * 지도 중심 이동
         */
        setMapCenter({
          latitude:
            current.latitude,

          longitude:
            current.longitude,
        });

        /**
         * 현재 위치 행정동 확인
         */
        const dong =
          await getDongFromCoords(
            current.latitude,
            current.longitude,
          );

        if (!dong) {
          return;
        }

        setSelectedDong(
          dong.dongName,
        );

        setSelectedLabel(
          `현재 위치 · ${dong.dongName}`,
        );
      } catch (error) {
        console.error(
          '현재 위치 확인 실패:',
          error,
        );

        if (
          error instanceof Error &&
          error.message ===
            'LOCATION_PERMISSION_DENIED'
        ) {
          Alert.alert(
            '위치 권한이 필요해요',
            '현재 위치를 확인하려면 위치 권한을 허용해주세요.',
          );

          return;
        }

        Alert.alert(
          '현재 위치 확인 실패',
          '현재 위치를 가져오지 못했습니다.',
        );
      } finally {
        setCurrentLocationLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 세종시 전체 보기
   * =====================================================
   */
  const handleReset =
    () => {
      setMapCenter({
        latitude:
          SEJONG_CENTER.latitude,

        longitude:
          SEJONG_CENTER.longitude,
      });

      setSelectedPoint(
        null,
      );

      setSelectedDong('');

      setSelectedLabel('');

      setCurrentLocationAccuracy(
        null,
      );

      setSelectedRadius(
        500,
      );

      setSelectedBusiness('');
    };

  /**
   * =====================================================
   * 위치 선택 해제
   * =====================================================
   */
  const handleClear =
    () => {
      setSelectedPoint(
        null,
      );

      setSelectedDong('');

      setSelectedLabel('');

      setCurrentLocationAccuracy(
        null,
      );

      setSelectedBusiness('');
    };

  /**
   * =====================================================
   * 상권 분석 시작
   * =====================================================
   */
  const handleAnalyze =
    () => {
      if (!selectedPoint) {
        Alert.alert(
          '위치를 선택해주세요',
          '지도에서 분석하고 싶은 위치를 선택해주세요.',
        );

        return;
      }

      if (!selectedDong) {
        Alert.alert(
          '위치 확인 필요',
          '선택한 위치의 행정동 정보를 확인하지 못했습니다.',
        );

        return;
      }

      /**
       * 현재 분석 가능한
       * 세종시 지역인지 확인
       */
      const supported =
        sejongAreas.some(
          area =>
            area.name ===
            selectedDong,
        );

      if (!supported) {
        Alert.alert(
          '지원 지역 안내',
          `현재는 지원되는 세종시 지역만 분석할 수 있습니다.\n\n선택 위치: ${selectedDong}`,
        );

        return;
      }

      if (!selectedBusiness) {
        Alert.alert(
          '업종을 선택해주세요',
          '분석하고 싶은 업종을 선택해주세요.',
        );

        return;
      }

      /**
       * 결과 화면 전달 데이터
       */
      const detailedLocations = [
        {
          label:
            selectedLabel ||
            `${selectedDong} 내 선택 위치`,

          dongName:
            selectedDong,

          coordinates: {
            lat:
              selectedPoint.lat,

            lng:
              selectedPoint.lng,
          },

          radius:
            selectedRadius,
        },
      ];

      router.push({
        pathname:
          '/market-analysis/region-result',

        params: {
          businesses:
            selectedBusiness,

          areas: '',

          detailedLocations:
            JSON.stringify(
              detailedLocations,
            ),
        },
      });
    };

  return (
    <View style={styles.screen}>
      {/* ================================================
          HEADER
      ================================================ */}

      <View style={styles.header}>
        <View
          style={
            styles.headerTextArea
          }
        >
          <Text style={styles.title}>
            상권 지도
          </Text>

          <Text
            style={
              styles.description
            }
          >
            지도를 클릭하고 원하는 위치의 상권을 바로 분석해보세요.
          </Text>
        </View>

        <View
          style={
            styles.headerButtons
          }
        >
          <TouchableOpacity
            style={
              styles.resetButton
            }
            activeOpacity={0.8}
            onPress={handleReset}
          >
            <Text
              style={
                styles.resetButtonText
              }
            >
              세종시 전체
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.currentLocationButton
            }
            activeOpacity={0.8}
            disabled={
              currentLocationLoading
            }
            onPress={
              handleCurrentLocation
            }
          >
            {currentLocationLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.primary
                }
              />
            ) : (
              <>
                <Text
                  style={
                    styles.currentLocationIcon
                  }
                >
                  📍
                </Text>

                <Text
                  style={
                    styles.currentLocationText
                  }
                >
                  내 위치
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ================================================
          MAIN
      ================================================ */}

      <View
        style={[
          styles.main,

          isSmallScreen &&
            styles.mainSmall,
        ]}
      >
        {/* ==============================================
            MAP
        ============================================== */}

        <View
          style={[
            styles.mapArea,

            isSmallScreen &&
              styles.mapAreaSmall,
          ]}
        >
          <AddressMap
            latitude={
              mapCenter.latitude
            }
            longitude={
              mapCenter.longitude
            }
            selectable
            onMapPress={
              handleMapPress
            }
            selectedPoint={
              selectedPoint
                ? {
                    latitude:
                      selectedPoint.lat,

                    longitude:
                      selectedPoint.lng,
                  }
                : null
            }
            selectedPointLabel={
              selectedLabel ||
              undefined
            }
            radius={
              selectedRadius
            }
          />

          {/* 지도 안내 */}

          {!selectedPoint &&
            !pointLoading && (
              <View
                style={
                  styles.mapGuide
                }
                pointerEvents="none"
              >
                <Text
                  style={
                    styles.mapGuideIcon
                  }
                >
                  👆
                </Text>

                <View
                  style={
                    styles.mapGuideTextArea
                  }
                >
                  <Text
                    style={
                      styles.mapGuideTitle
                    }
                  >
                    분석할 위치를 선택하세요
                  </Text>

                  <Text
                    style={
                      styles.mapGuideDescription
                    }
                  >
                    지도에서 원하는 곳을 클릭하거나 내 위치를 이용하세요.
                  </Text>
                </View>
              </View>
            )}

          {/* 행정동 확인 중 */}

          {pointLoading && (
            <View
              style={
                styles.loadingBox
              }
              pointerEvents="none"
            >
              <ActivityIndicator
                size="small"
                color={
                  COLORS.primary
                }
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                위치 확인 중...
              </Text>
            </View>
          )}
        </View>

        {/* ==============================================
            ANALYSIS PANEL
        ============================================== */}

        <View
          style={[
            styles.panel,

            isSmallScreen &&
              styles.panelSmall,
          ]}
        >
          {!selectedPoint ? (
            /**
             * 위치 선택 전
             */
            <View
              style={
                styles.emptyPanel
              }
            >
              <View
                style={
                  styles.emptyIconBox
                }
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  📍
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                분석 위치를 선택해주세요
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                지도에서 원하는 지점을 클릭하면 분석 범위와 업종을 선택할 수 있어요.
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyCurrentButton
                }
                activeOpacity={0.8}
                disabled={
                  currentLocationLoading
                }
                onPress={
                  handleCurrentLocation
                }
              >
                {currentLocationLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.primary
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.emptyCurrentText
                    }
                  >
                    📍 현재 위치 사용
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /**
             * 위치 선택 후
             */
            <ScrollView
              style={
                styles.panelScroll
              }
              contentContainerStyle={
                styles.panelContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* =========================================
                  선택 위치
              ========================================= */}

              <View
                style={
                  styles.locationTop
                }
              >
                <View
                  style={
                    styles.locationTextArea
                  }
                >
                  <Text
                    style={
                      styles.locationLabel
                    }
                  >
                    분석 위치
                  </Text>

                  <Text
                    style={
                      styles.locationName
                    }
                  >
                    📍{' '}
                    {selectedLabel ||
                      '선택한 위치'}
                  </Text>
                </View>

                {!!selectedDong && (
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
                        selectedDong
                      }
                    </Text>
                  </View>
                )}
              </View>

              {/* =========================================
                  좌표
              ========================================= */}

              <View
                style={
                  styles.coordinateBox
                }
              >
                <View
                  style={
                    styles.coordinateItem
                  }
                >
                  <Text
                    style={
                      styles.coordinateLabel
                    }
                  >
                    위도
                  </Text>

                  <Text
                    style={
                      styles.coordinateValue
                    }
                  >
                    {selectedPoint.lat.toFixed(
                      6,
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.coordinateDivider
                  }
                />

                <View
                  style={
                    styles.coordinateItem
                  }
                >
                  <Text
                    style={
                      styles.coordinateLabel
                    }
                  >
                    경도
                  </Text>

                  <Text
                    style={
                      styles.coordinateValue
                    }
                  >
                    {selectedPoint.lng.toFixed(
                      6,
                    )}
                  </Text>
                </View>
              </View>

              {/* GPS 정확도 */}

              {currentLocationAccuracy !==
                null && (
                <View
                  style={
                    styles.accuracyBox
                  }
                >
                  <Text
                    style={
                      styles.accuracyText
                    }
                  >
                    GPS 위치 정확도 약{' '}
                    {Math.round(
                      currentLocationAccuracy,
                    )}
                    m
                  </Text>
                </View>
              )}

              {/* =========================================
                  분석 범위
              ========================================= */}

              <View
                style={
                  styles.section
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  분석 범위
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  선택한 위치에서 어느 범위까지 분석할지 선택해주세요.
                </Text>

                <View
                  style={
                    styles.radiusRow
                  }
                >
                  {radiusOptions.map(
                    option => {
                      const active =
                        selectedRadius ===
                        option.value;

                      return (
                        <TouchableOpacity
                          key={
                            option.value
                          }
                          style={[
                            styles.radiusButton,

                            active &&
                              styles.radiusButtonActive,
                          ]}
                          activeOpacity={
                            0.8
                          }
                          onPress={() =>
                            setSelectedRadius(
                              option.value,
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.radiusText,

                              active &&
                                styles.radiusTextActive,
                            ]}
                          >
                            {
                              option.label
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>

                <View
                  style={
                    styles.radiusHint
                  }
                >
                  <Text
                    style={
                      styles.radiusHintText
                    }
                  >
                    {selectedRadius ===
                    300
                      ? '가까운 주변 상권을 세밀하게 분석합니다.'
                      : selectedRadius ===
                          500
                        ? '일반적인 도보 생활권을 기준으로 분석합니다.'
                        : '넓은 주변 상권까지 함께 분석합니다.'}
                  </Text>
                </View>
              </View>

              {/* =========================================
                  분석 업종
              ========================================= */}

              <View
                style={
                  styles.section
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  분석 업종
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  선택한 위치에서 분석하고 싶은 업종을 하나 골라주세요.
                </Text>

                <View
                  style={
                    styles.businessList
                  }
                >
                  {allBusinesses.map(
                    business => {
                      const active =
                        selectedBusiness ===
                        business.name;

                      return (
                        <TouchableOpacity
                          key={
                            business.name
                          }
                          style={[
                            styles.businessButton,

                            active &&
                              styles.businessButtonActive,
                          ]}
                          activeOpacity={
                            0.8
                          }
                          onPress={() =>
                            setSelectedBusiness(
                              active
                                ? ''
                                : business.name,
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.businessText,

                              active &&
                                styles.businessTextActive,
                            ]}
                          >
                            {
                              business.name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              </View>

              {/* =========================================
                  분석 시작
              ========================================= */}

              <TouchableOpacity
                style={[
                  styles.analyzeButton,

                  !selectedBusiness &&
                    styles.analyzeButtonDisabled,
                ]}
                activeOpacity={0.85}
                disabled={
                  !selectedBusiness
                }
                onPress={
                  handleAnalyze
                }
              >
                <Text
                  style={[
                    styles.analyzeButtonText,

                    !selectedBusiness &&
                      styles.analyzeButtonTextDisabled,
                  ]}
                >
                  {selectedBusiness
                    ? `${selectedBusiness} 상권 분석하기 →`
                    : '분석할 업종을 선택해주세요'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.clearButton
                }
                activeOpacity={0.8}
                onPress={
                  handleClear
                }
              >
                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  위치 선택 해제
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    /**
     * 전체 화면
     */
    screen: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',
    },

    /**
     * HEADER
     */
    header: {
      minHeight: 88,

      paddingHorizontal: 24,

      paddingVertical: 15,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      gap: 20,

      backgroundColor:
        '#FFFFFF',

      borderBottomWidth: 1,

      borderBottomColor:
        '#E5E7EB',
    },

    headerTextArea: {
      flex: 1,
    },

    title: {
      fontSize: 24,

      fontWeight: '900',

      color:
        COLORS.text,
    },

    description: {
      marginTop: 4,

      fontSize: 11,

      color:
        COLORS.textSecondary,
    },

    headerButtons: {
      flexDirection: 'row',

      gap: 9,
    },

    resetButton: {
      minHeight: 42,

      paddingHorizontal: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    resetButtonText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    currentLocationButton: {
      minHeight: 42,

      minWidth: 90,

      paddingHorizontal: 14,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#CDEBD5',

      backgroundColor:
        '#F2FFF5',
    },

    currentLocationIcon: {
      marginRight: 5,

      fontSize: 14,
    },

    currentLocationText: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.primary,
    },

    /**
     * MAIN
     */
    main: {
      flex: 1,

      flexDirection: 'row',

      minHeight: 0,
    },

    mainSmall: {
      flexDirection: 'column',
    },

    /**
     * MAP
     */
    mapArea: {
      flex: 1,

      minWidth: 0,

      minHeight: 0,

      position: 'relative',

      overflow: 'hidden',

      backgroundColor:
        '#F3F4F6',
    },

    mapAreaSmall: {
      flex: 0,

      height: 500,
    },

    /**
     * 지도 안내
     */
    mapGuide: {
      position: 'absolute',

      top: 16,

      right: 16,

      maxWidth: 300,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 9,

      paddingHorizontal: 14,

      paddingVertical: 11,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    mapGuideIcon: {
      fontSize: 18,
    },

    mapGuideTextArea: {
      flexShrink: 1,
    },

    mapGuideTitle: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.text,
    },

    mapGuideDescription: {
      marginTop: 2,

      fontSize: 9,

      lineHeight: 13,

      color:
        COLORS.textSecondary,
    },

    loadingBox: {
      position: 'absolute',

      top: 16,

      right: 16,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      paddingHorizontal: 14,

      paddingVertical: 10,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    loadingText: {
      fontSize: 10,

      color:
        COLORS.textSecondary,
    },

    /**
     * 오른쪽 패널
     */
    panel: {
      width: 400,

      minWidth: 400,

      flexShrink: 0,

      minHeight: 0,

      backgroundColor:
        '#FFFFFF',

      borderLeftWidth: 1,

      borderLeftColor:
        '#E5E7EB',
    },

    panelSmall: {
      width: '100%',

      minWidth: 0,

      minHeight: 500,

      borderLeftWidth: 0,

      borderTopWidth: 1,

      borderTopColor:
        '#E5E7EB',
    },

    /**
     * 위치 선택 전 패널
     */
    emptyPanel: {
      flex: 1,

      paddingHorizontal: 38,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    emptyIconBox: {
      width: 62,

      height: 62,

      borderRadius: 31,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 16,

      backgroundColor:
        '#F0FFF4',
    },

    emptyIcon: {
      fontSize: 26,
    },

    emptyTitle: {
      fontSize: 17,

      fontWeight: '900',

      textAlign: 'center',

      color:
        COLORS.text,
    },

    emptyDescription: {
      marginTop: 8,

      fontSize: 11,

      lineHeight: 18,

      textAlign: 'center',

      color:
        COLORS.textSecondary,
    },

    emptyCurrentButton: {
      minHeight: 44,

      marginTop: 18,

      paddingHorizontal: 18,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        '#CDEBD5',

      backgroundColor:
        '#F2FFF5',
    },

    emptyCurrentText: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.primary,
    },

    /**
     * 선택 후 패널
     */
    panelScroll: {
      flex: 1,

      backgroundColor:
        '#FFFFFF',
    },

    panelContent: {
      padding: 20,

      paddingBottom: 32,
    },

    /**
     * 위치 정보
     */
    locationTop: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      gap: 10,
    },

    locationTextArea: {
      flex: 1,
    },

    locationLabel: {
      marginBottom: 5,

      fontSize: 10,

      color:
        COLORS.textSecondary,
    },

    locationName: {
      fontSize: 17,

      lineHeight: 23,

      fontWeight: '900',

      color:
        COLORS.text,
    },

    dongBadge: {
      paddingHorizontal: 9,

      paddingVertical: 5,

      borderRadius: 999,

      backgroundColor:
        '#EAF8ED',
    },

    dongBadgeText: {
      fontSize: 10,

      fontWeight: '800',

      color:
        COLORS.primary,
    },

    /**
     * 좌표
     */
    coordinateBox: {
      marginTop: 15,

      flexDirection: 'row',

      paddingVertical: 13,

      borderRadius: 12,

      backgroundColor:
        '#F8FAF8',
    },

    coordinateItem: {
      flex: 1,

      alignItems: 'center',
    },

    coordinateDivider: {
      width: 1,

      backgroundColor:
        '#E5E7EB',
    },

    coordinateLabel: {
      marginBottom: 4,

      fontSize: 9,

      color:
        '#9CA3AF',
    },

    coordinateValue: {
      fontSize: 11,

      fontWeight: '800',

      color:
        COLORS.text,
    },

    accuracyBox: {
      marginTop: 9,

      padding: 9,

      borderRadius: 9,

      backgroundColor:
        '#EFFCF2',
    },

    accuracyText: {
      fontSize: 10,

      fontWeight: '700',

      color:
        COLORS.primary,
    },

    /**
     * 공통 section
     */
    section: {
      marginTop: 22,

      paddingTop: 18,

      borderTopWidth: 1,

      borderTopColor:
        '#F0F1F0',
    },

    sectionTitle: {
      fontSize: 14,

      fontWeight: '900',

      color:
        COLORS.text,
    },

    sectionDescription: {
      marginTop: 4,

      marginBottom: 11,

      fontSize: 10,

      lineHeight: 15,

      color:
        COLORS.textSecondary,
    },

    /**
     * 반경
     */
    radiusRow: {
      flexDirection: 'row',

      gap: 7,
    },

    radiusButton: {
      flex: 1,

      minHeight: 42,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    radiusButtonActive: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#F0FFF4',
    },

    radiusText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    radiusTextActive: {
      color:
        COLORS.primary,

      fontWeight: '900',
    },

    radiusHint: {
      marginTop: 9,

      padding: 9,

      borderRadius: 9,

      backgroundColor:
        '#F8FAF8',
    },

    radiusHintText: {
      fontSize: 9,

      lineHeight: 14,

      color:
        COLORS.textSecondary,
    },

    /**
     * 업종
     */
    businessList: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 7,
    },

    businessButton: {
      paddingVertical: 8,

      paddingHorizontal: 11,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        '#E5E7EB',

      backgroundColor:
        '#FFFFFF',
    },

    businessButtonActive: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#F0FFF4',
    },

    businessText: {
      fontSize: 10,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },

    businessTextActive: {
      color:
        COLORS.primary,

      fontWeight: '900',
    },

    /**
     * 분석 버튼
     */
    analyzeButton: {
      minHeight: 52,

      marginTop: 22,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        COLORS.neonLime,
    },

    analyzeButtonDisabled: {
      backgroundColor:
        COLORS.disabled,
    },

    analyzeButtonText: {
      fontSize: 13,

      fontWeight: '900',

      color:
        '#111111',
    },

    analyzeButtonTextDisabled: {
      color:
        '#9CA3AF',
    },

    clearButton: {
      minHeight: 44,

      marginTop: 8,

      alignItems: 'center',

      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        '#F7F8F7',
    },

    clearButtonText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.textSecondary,
    },
  });
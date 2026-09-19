import AddressMap, {
  MapMarkerData,
} from '@/components/address-map';

import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import {
  Coordinates,
  getDongFromCoords,
  searchLocation,
} from '@/services/geocoding';

import {
  getCurrentLocation,
} from '@/services/currentLocation';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type SelectMode =
  | 'map'
  | 'current'
  | 'direct';

type Radius =
  | 300
  | 500
  | 1000;

interface DetailedLocation {
  label: string;

  dongName: string;

  coordinates: Coordinates;

  radius: Radius;
}

export default function RegionSelectionScreen() {
  const router =
    useRouter();

  const {
    businesses,
  } =
    useLocalSearchParams<{
      businesses: string;
    }>();

  const SEJONG_CENTER = {
    latitude:
      36.48,

    longitude:
      127.289,
  };

  const [
    mapCenter,
    setMapCenter,
  ] =
    useState({
      latitude:
        SEJONG_CENTER.latitude,

      longitude:
        SEJONG_CENTER.longitude,
    });

  const [
    selectMode,
    setSelectMode,
  ] =
    useState<SelectMode>(
      'map',
    );

  /**
   * =====================================================
   * 동 전체 선택
   * =====================================================
   */
  const [
    selectedAreas,
    setSelectedAreas,
  ] =
    useState<string[]>(
      [],
    );

  const [
    areaMarkers,
    setAreaMarkers,
  ] =
    useState<
      MapMarkerData[]
    >([]);

  const [
    loadingArea,
    setLoadingArea,
  ] =
    useState<
      string | null
    >(null);

  /**
   * =====================================================
   * 지도 / 현재 위치 선택
   * =====================================================
   */
  const [
    mapSelectedPoint,
    setMapSelectedPoint,
  ] =
    useState<
      Coordinates | null
    >(null);

  const [
    mapSelectedDong,
    setMapSelectedDong,
  ] =
    useState('');

  const [
    mapSelectedLabel,
    setMapSelectedLabel,
  ] =
    useState('');

  const [
    mapPointLoading,
    setMapPointLoading,
  ] =
    useState(false);

  /**
   * =====================================================
   * 현재 위치
   * =====================================================
   */
  const [
    currentLocationLoading,
    setCurrentLocationLoading,
  ] =
    useState(false);

  const [
    currentLocationAccuracy,
    setCurrentLocationAccuracy,
  ] =
    useState<
      number | null
    >(null);

  /**
   * =====================================================
   * 직접 검색
   * =====================================================
   */
  const [
    searchText,
    setSearchText,
  ] =
    useState('');

  const [
    searchedLocation,
    setSearchedLocation,
  ] =
    useState<
      Coordinates | null
    >(null);

  const [
    searchedDong,
    setSearchedDong,
  ] =
    useState('');

  const [
    searching,
    setSearching,
  ] =
    useState(false);

  const [
    searchError,
    setSearchError,
  ] =
    useState('');

  /**
   * =====================================================
   * 분석 반경
   * =====================================================
   */
  const [
    selectedRadius,
    setSelectedRadius,
  ] =
    useState<Radius>(
      500,
    );

  /**
   * =====================================================
   * 추가된 세부 위치
   * =====================================================
   */
  const [
    detailedLocations,
    setDetailedLocations,
  ] =
    useState<
      DetailedLocation[]
    >([]);

  const totalSelected =
    selectedAreas.length +
    detailedLocations.length;

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
   * 동 전체 선택 / 해제
   * =====================================================
   */
  const toggleArea =
    async (
      name: string,
    ) => {
      if (
        selectedAreas.includes(
          name,
        )
      ) {
        setSelectedAreas(
          prev =>
            prev.filter(
              area =>
                area !==
                name,
            ),
        );

        setAreaMarkers(
          prev =>
            prev.filter(
              marker =>
                marker.name !==
                name,
            ),
        );

        return;
      }

      try {
        setLoadingArea(
          name,
        );

        const result =
          await searchLocation(
            `세종특별자치시 ${name}`,
          );

        if (!result) {
          Alert.alert(
            '위치 확인 실패',
            `${name}의 위치 정보를 찾을 수 없습니다.`,
          );

          return;
        }

        setSelectedAreas(
          prev => [
            ...prev,
            name,
          ],
        );

        setAreaMarkers(
          prev => [
            ...prev,

            {
              name,

              latitude:
                result.lat,

              longitude:
                result.lng,
            },
          ],
        );

        setMapCenter({
          latitude:
            result.lat,

          longitude:
            result.lng,
        });
      } catch (
        error
      ) {
        console.error(
          '동 위치 검색 실패:',
          error,
        );

        Alert.alert(
          '오류',
          '지역 위치를 불러오지 못했습니다.',
        );
      } finally {
        setLoadingArea(
          null,
        );
      }
    };

  /**
   * =====================================================
   * 지도 직접 클릭
   * =====================================================
   */
  const handleMapPress =
    useCallback(
      async (
        latitude: number,
        longitude: number,
      ) => {
        try {
          setMapPointLoading(
            true,
          );

          setCurrentLocationAccuracy(
            null,
          );

          const dong =
            await getDongFromCoords(
              latitude,
              longitude,
            );

          if (!dong) {
            Alert.alert(
              '위치 확인 실패',
              '행정동 정보를 찾을 수 없습니다.',
            );

            return;
          }

          const supported =
            sejongAreas.some(
              area =>
                area.name ===
                dong.dongName,
            );

          if (!supported) {
            Alert.alert(
              '지원 지역 안내',
              '현재는 지원되는 세종시 지역만 선택할 수 있습니다.',
            );

            return;
          }

          const point: Coordinates =
            {
              lat:
                latitude,

              lng:
                longitude,
            };

          setMapSelectedPoint(
            point,
          );

          setMapSelectedDong(
            dong.dongName,
          );

          setMapSelectedLabel(
            `${dong.dongName} 내 선택 지점`,
          );

          setMapCenter({
            latitude,

            longitude,
          });
        } catch (
          error
        ) {
          console.error(
            '지도 위치 확인 실패:',
            error,
          );

          Alert.alert(
            '오류',
            '위치 정보를 확인하지 못했습니다.',
          );
        } finally {
          setMapPointLoading(
            false,
          );
        }
      },
      [],
    );

  /**
   * =====================================================
   * 현재 GPS 위치
   * =====================================================
   */
  const handleCurrentLocation =
    async () => {
      try {
        setCurrentLocationLoading(
          true,
        );

        setCurrentLocationAccuracy(
          null,
        );

        const current =
          await getCurrentLocation();

        console.log(
          'GPS 현재 위치:',
          {
            latitude:
              current.latitude,

            longitude:
              current.longitude,

            accuracy:
              current.accuracy,
          },
        );

        const point: Coordinates =
          {
            lat:
              current.latitude,

            lng:
              current.longitude,
          };

        /**
         * 지원 여부 검사 전에
         * 지도부터 현재 위치로 이동
         */
        setMapCenter({
          latitude:
            current.latitude,

          longitude:
            current.longitude,
        });

        setMapSelectedPoint(
          point,
        );

        setMapSelectedLabel(
          '현재 위치',
        );

        setCurrentLocationAccuracy(
          current.accuracy,
        );

        setSelectMode(
          'current',
        );

        /**
         * 현재 좌표의 행정동 확인
         */
        const dong =
          await getDongFromCoords(
            current.latitude,
            current.longitude,
          );

        if (!dong) {
          setMapSelectedDong(
            '',
          );

          setMapSelectedLabel(
            '현재 위치',
          );

          Alert.alert(
            '행정동 확인 실패',
            'GPS 현재 위치는 확인했지만 행정동 정보를 찾지 못했습니다.',
          );

          return;
        }

        setMapSelectedDong(
          dong.dongName,
        );

        setMapSelectedLabel(
          `현재 위치 · ${dong.dongName}`,
        );

        const supported =
          sejongAreas.some(
            area =>
              area.name ===
                dong.dongName,
          );

        if (!supported) {
          Alert.alert(
            '현재 위치는 분석 지원 지역이 아니에요',
            `현재 위치는 '${dong.dongName}'으로 확인되었습니다.\n\n지도에는 현재 위치를 표시하지만, 현재는 지원되는 세종시 지역만 분석할 수 있습니다.`,
          );

          return;
        }

        console.log(
          '현재 위치 분석 가능:',
          {
            dong:
              dong.dongName,

            latitude:
              current.latitude,

            longitude:
              current.longitude,

            accuracy:
              current.accuracy,
          },
        );
      } catch (
        error
      ) {
        console.error(
          '현재 위치 조회 실패:',
          error,
        );

        if (
          error instanceof
            Error &&
          error.message ===
            'LOCATION_PERMISSION_DENIED'
        ) {
          Alert.alert(
            '위치 권한이 필요해요',
            '현재 위치 기반 상권 분석을 사용하려면 위치 권한을 허용해주세요.',
          );

          return;
        }

        if (
          error instanceof
            Error &&
          error.message ===
            'GEOLOCATION_NOT_SUPPORTED'
        ) {
          Alert.alert(
            '현재 위치를 사용할 수 없어요',
            '현재 브라우저에서는 위치 기능을 지원하지 않습니다.',
          );

          return;
        }

        Alert.alert(
          '현재 위치 확인 실패',
          '현재 위치를 가져오지 못했습니다. 브라우저 위치 권한 또는 Windows 위치 서비스를 확인해주세요.',
        );
      } finally {
        setCurrentLocationLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 지도 / 현재 위치를 분석 대상으로 확정
   * =====================================================
   */
  const addMapLocation =
    () => {
      if (
        !mapSelectedPoint ||
        !mapSelectedDong
      ) {
        Alert.alert(
          '위치 확인 필요',
          '분석할 위치의 행정동 정보를 확인해주세요.',
        );

        return;
      }

      const supported =
        sejongAreas.some(
          area =>
            area.name ===
              mapSelectedDong,
        );

      if (!supported) {
        Alert.alert(
          '분석할 수 없는 위치',
          '현재는 지원되는 세종시 지역만 분석할 수 있습니다.',
        );

        return;
      }

      const exists =
        detailedLocations.some(
          location =>
            Math.abs(
              location.coordinates.lat -
                mapSelectedPoint.lat,
            ) <
              0.000001 &&
            Math.abs(
              location.coordinates.lng -
                mapSelectedPoint.lng,
            ) <
              0.000001 &&
            location.radius ===
              selectedRadius,
        );

      if (exists) {
        Alert.alert(
          '이미 추가된 위치',
          '같은 위치와 같은 분석 범위가 이미 추가되어 있습니다.',
        );

        return;
      }

      /**
       * 같은 동 전체가 선택되어 있으면 제거
       */
      setSelectedAreas(
        prev =>
          prev.filter(
            area =>
              area !==
              mapSelectedDong,
          ),
      );

      setAreaMarkers(
        prev =>
          prev.filter(
            marker =>
              marker.name !==
              mapSelectedDong,
          ),
      );

      const label =
        mapSelectedLabel ||
        `${mapSelectedDong} 내 선택 지점`;

      setDetailedLocations(
        prev => [
          ...prev,

          {
            label,

            dongName:
              mapSelectedDong,

            coordinates:
              mapSelectedPoint,

            radius:
              selectedRadius,
          },
        ],
      );

      setMapSelectedPoint(
        null,
      );

      setMapSelectedDong(
        '',
      );

      setMapSelectedLabel(
        '',
      );

      setCurrentLocationAccuracy(
        null,
      );

      setSelectMode(
        'map',
      );
    };

  /**
   * =====================================================
   * 지도 선택 취소
   * =====================================================
   */
  const cancelMapLocation =
    () => {
      setMapSelectedPoint(
        null,
      );

      setMapSelectedDong(
        '',
      );

      setMapSelectedLabel(
        '',
      );

      setCurrentLocationAccuracy(
        null,
      );

      setSelectMode(
        'map',
      );
    };

  /**
   * =====================================================
   * 직접 위치 검색
   * =====================================================
   */
  const handleSearch =
    async () => {
      const query =
        searchText.trim();

      if (!query) {
        return;
      }

      try {
        setSearching(
          true,
        );

        setSearchError(
          '',
        );

        setSearchedLocation(
          null,
        );

        setSearchedDong(
          '',
        );

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

        const result =
          await searchLocation(
            searchQuery,
          );

        if (!result) {
          setSearchError(
            '검색 결과가 없습니다. 주소나 장소명을 다시 확인해주세요.',
          );

          return;
        }

        const dong =
          await getDongFromCoords(
            result.lat,
            result.lng,
          );

        if (!dong) {
          setSearchError(
            '행정동 정보를 찾을 수 없습니다.',
          );

          return;
        }

        const supported =
          sejongAreas.some(
            area =>
              area.name ===
                dong.dongName,
          );

        if (!supported) {
          setSearchError(
            '현재는 지원되는 세종시 지역만 선택할 수 있습니다.',
          );

          return;
        }

        setSearchedLocation(
          result,
        );

        setSearchedDong(
          dong.dongName,
        );
      } catch (
        error
      ) {
        console.error(
          '위치 검색 실패:',
          error,
        );

        setSearchError(
          '위치 검색 중 오류가 발생했습니다.',
        );
      } finally {
        setSearching(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 검색 위치 분석 대상으로 확정
   * =====================================================
   */
  const addSearchLocation =
    () => {
      if (
        !searchedLocation ||
        !searchedDong
      ) {
        return;
      }

      const label =
        searchText.trim();

      if (!label) {
        return;
      }

      const exists =
        detailedLocations.some(
          location =>
            location.label ===
              label &&
            location.radius ===
              selectedRadius,
        );

      if (exists) {
        Alert.alert(
          '이미 추가된 위치',
          '같은 위치가 이미 추가되어 있습니다.',
        );

        return;
      }

      setSelectedAreas(
        prev =>
          prev.filter(
            area =>
              area !==
              searchedDong,
          ),
      );

      setAreaMarkers(
        prev =>
          prev.filter(
            marker =>
              marker.name !==
              searchedDong,
          ),
      );

      setDetailedLocations(
        prev => [
          ...prev,

          {
            label,

            dongName:
              searchedDong,

            coordinates:
              searchedLocation,

            radius:
              selectedRadius,
          },
        ],
      );

      setSearchText(
        '',
      );

      setSearchedLocation(
        null,
      );

      setSearchedDong(
        '',
      );
    };

  /**
   * =====================================================
   * 동 제거
   * =====================================================
   */
  const removeArea =
    (
      name: string,
    ) => {
      setSelectedAreas(
        prev =>
          prev.filter(
            area =>
              area !==
              name,
          ),
      );

      setAreaMarkers(
        prev =>
          prev.filter(
            marker =>
              marker.name !==
              name,
          ),
      );
    };

  /**
   * =====================================================
   * 세부 위치 제거
   * =====================================================
   */
  const removeDetailedLocation =
    (
      index: number,
    ) => {
      setDetailedLocations(
        prev =>
          prev.filter(
            (
              _,
              i,
            ) =>
              i !==
              index,
          ),
      );
    };

  /**
   * =====================================================
   * 분석 시작
   * =====================================================
   */
  const handleAnalyze =
    () => {
      if (
        totalSelected ===
        0
      ) {
        return;
      }

      router.push({
        pathname:
          '/market-analysis/region-result',

        params: {
          businesses,

          areas:
            selectedAreas.join(
              ',',
            ),

          detailedLocations:
            JSON.stringify(
              detailedLocations,
            ),
        },
      });
    };

  const visibleAreaMarkers =
    mapSelectedDong
      ? areaMarkers.filter(
          marker =>
            marker.name !==
            mapSelectedDong,
        )
      : areaMarkers;

  return (
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
            styles.header
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            지역 선택
          </Text>

          <Text
            style={
              styles.headerSub
            }
          >
            분석하고 싶은 세종시 지역이나
            세부 위치를 선택해주세요
          </Text>

          <View
            style={
              styles.headerBadge
            }
          >
            <Text
              style={
                styles.headerBadgeText
              }
            >
              동 · 지도 · 현재 위치 · 주소 검색 가능
            </Text>
          </View>
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
                styles.sectionTitleArea
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
                  styles.sectionTextArea
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  선택 방식
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  지도, 현재 위치 또는 주소 검색으로
                  분석 지점을 선택해주세요
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.selectedCount
              }
            >
              총 {totalSelected}개
            </Text>
          </View>

          <View
            style={
              styles.modeRow
            }
          >
            <TouchableOpacity
              style={[
                styles.modeButton,

                selectMode ===
                  'map' &&
                  styles.modeButtonActive,
              ]}
              activeOpacity={
                0.8
              }
              onPress={() =>
                setSelectMode(
                  'map',
                )
              }
            >
              <Text
                style={
                  styles.modeIcon
                }
              >
                🗺️
              </Text>

              <View
                style={
                  styles.modeTextArea
                }
              >
                <Text
                  style={[
                    styles.modeTitle,

                    selectMode ===
                      'map' &&
                      styles.modeTitleActive,
                  ]}
                >
                  지도에서 선택
                </Text>

                <Text
                  style={
                    styles.modeDescription
                  }
                >
                  동 또는 지도 지점 선택
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,

                selectMode ===
                  'current' &&
                  styles.modeButtonActive,
              ]}
              activeOpacity={
                0.8
              }
              disabled={
                currentLocationLoading
              }
              onPress={() => {
                setSelectMode(
                  'current',
                );

                handleCurrentLocation();
              }}
            >
              {currentLocationLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.primary
                  }
                  style={
                    styles.modeLoading
                  }
                />
              ) : (
                <Text
                  style={
                    styles.modeIcon
                  }
                >
                  📍
                </Text>
              )}

              <View
                style={
                  styles.modeTextArea
                }
              >
                <Text
                  style={[
                    styles.modeTitle,

                    selectMode ===
                      'current' &&
                      styles.modeTitleActive,
                  ]}
                >
                  내 현재 위치
                </Text>

                <Text
                  style={
                    styles.modeDescription
                  }
                >
                  GPS로 세부 위치 확인
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,

                selectMode ===
                  'direct' &&
                  styles.modeButtonActive,
              ]}
              activeOpacity={
                0.8
              }
              onPress={() =>
                setSelectMode(
                  'direct',
                )
              }
            >
              <Text
                style={
                  styles.modeIcon
                }
              >
                🔍
              </Text>

              <View
                style={
                  styles.modeTextArea
                }
              >
                <Text
                  style={[
                    styles.modeTitle,

                    selectMode ===
                      'direct' &&
                      styles.modeTitleActive,
                  ]}
                >
                  직접 위치 검색
                </Text>

                <Text
                  style={
                    styles.modeDescription
                  }
                >
                  주소·건물명을 검색
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* STEP 2 */}

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
                styles.sectionTitleArea
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
                  styles.sectionTextArea
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  위치 선택
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  {selectMode ===
                  'direct'
                    ? '주소나 건물명을 검색하세요'
                    : mapSelectedLabel
                      ? '선택한 세부 위치와 분석 범위를 확인하세요'
                      : '동을 선택하거나 지도에서 원하는 위치를 클릭하세요'}
                </Text>
              </View>
            </View>
          </View>

          {selectMode !==
          'direct' ? (
            <>
              <View
                style={
                  styles.mapContainer
                }
              >
                <View
                  style={
                    styles.mapHeader
                  }
                >
                  <View
                    style={
                      styles.mapHeaderTextArea
                    }
                  >
                    <Text
                      style={
                        styles.mapTitle
                      }
                    >
                      세종시 지도
                    </Text>

                    <Text
                      style={
                        styles.mapDescription
                      }
                    >
                      {mapSelectedLabel
                        ? mapSelectedLabel
                        : '동을 선택하거나 지도에서 원하는 지점을 선택하세요'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.mapHint
                    }
                  >
                    지도 클릭 가능
                  </Text>
                </View>

                <View
                  style={
                    styles.mapArea
                  }
                >
                  <AddressMap
                    latitude={
                      mapCenter.latitude
                    }
                    longitude={
                      mapCenter.longitude
                    }
                    markers={
                      visibleAreaMarkers
                    }
                    selectable
                    onMapPress={
                      handleMapPress
                    }
                    selectedPoint={
                      mapSelectedPoint
                        ? {
                            latitude:
                              mapSelectedPoint.lat,

                            longitude:
                              mapSelectedPoint.lng,
                          }
                        : null
                    }
                    selectedPointLabel={
                      mapSelectedLabel ||
                      undefined
                    }
                    radius={
                      selectedRadius
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.currentLocationButton
                }
                activeOpacity={
                  0.8
                }
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
                      styles.currentLocationIcon
                    }
                  >
                    📍
                  </Text>
                )}

                <View
                  style={
                    styles.currentLocationTextArea
                  }
                >
                  <Text
                    style={
                      styles.currentLocationTitle
                    }
                  >
                    {currentLocationLoading
                      ? '현재 위치 확인 중...'
                      : '내 현재 위치로 이동'}
                  </Text>

                  <Text
                    style={
                      styles.currentLocationDescription
                    }
                  >
                    GPS 좌표를 이용해 현재 위치를
                    세부 분석 지점으로 선택합니다
                  </Text>
                </View>
              </TouchableOpacity>

              {mapPointLoading && (
                <View
                  style={
                    styles.loadingBox
                  }
                >
                  <ActivityIndicator
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    선택한 위치를 확인하고 있어요
                  </Text>
                </View>
              )}

              {mapSelectedPoint && (
                <View
                  style={
                    styles.detailBox
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    세부 분석 위치
                  </Text>

                  <Text
                    style={
                      styles.detailTitle
                    }
                  >
                    📍{' '}
                    {mapSelectedLabel ||
                      '현재 위치'}
                  </Text>

                  <Text
                    style={
                      styles.detailSubText
                    }
                  >
                    위도{' '}
                    {mapSelectedPoint.lat.toFixed(
                      6,
                    )}
                    {' · '}
                    경도{' '}
                    {mapSelectedPoint.lng.toFixed(
                      6,
                    )}
                  </Text>

                  {currentLocationAccuracy !==
                    null && (
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
                  )}

                  {!mapSelectedDong ? (
                    <Text
                      style={
                        styles.unsupportedText
                      }
                    >
                      이 위치는 현재 분석 대상으로
                      사용할 수 없습니다.
                    </Text>
                  ) : (
                    <Text
                      style={
                        styles.pendingText
                      }
                    >
                      분석 범위를 선택한 뒤 아래 버튼을 눌러
                      분석 위치로 확정해주세요.
                    </Text>
                  )}

                  <Text
                    style={
                      styles.radiusTitle
                    }
                  >
                    분석 범위
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
                      styles.radiusGuide
                    }
                  >
                    <Text
                      style={
                        styles.radiusGuideText
                      }
                    >
                      {selectedRadius ===
                      300
                        ? '점포 주변의 매우 가까운 상권을 분석합니다.'
                        : selectedRadius ===
                            500
                          ? '일반적인 도보 생활권 범위를 분석합니다.'
                          : '넓은 생활권과 주변 상권까지 함께 분석합니다.'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailButtonRow
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.cancelButton
                      }
                      activeOpacity={
                        0.8
                      }
                      onPress={
                        cancelMapLocation
                      }
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        선택 취소
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.addButton,

                        !mapSelectedDong &&
                          styles.addButtonDisabled,
                      ]}
                      activeOpacity={
                        0.8
                      }
                      disabled={
                        !mapSelectedDong
                      }
                      onPress={
                        addMapLocation
                      }
                    >
                      <Text
                        style={[
                          styles.addButtonText,

                          !mapSelectedDong &&
                            styles.addButtonTextDisabled,
                        ]}
                      >
                        분석 위치로 추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text
                style={
                  styles.quickTitle
                }
              >
                동 전체를 분석하려면
              </Text>

              <Text
                style={
                  styles.quickDescription
                }
              >
                원하는 동을 선택하면 지도가
                해당 동으로 이동합니다
              </Text>

              <View
                style={
                  styles.chipRow
                }
              >
                {sejongAreas.map(
                  area => {
                    const selected =
                      selectedAreas.includes(
                        area.name,
                      );

                    const loading =
                      loadingArea ===
                      area.name;

                    return (
                      <TouchableOpacity
                        key={
                          area.code
                        }
                        style={[
                          styles.regionChip,

                          selected &&
                            styles.regionChipSelected,
                        ]}
                        activeOpacity={
                          0.7
                        }
                        disabled={
                          loading
                        }
                        onPress={() =>
                          toggleArea(
                            area.name,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.regionText,

                            selected &&
                              styles.regionTextSelected,
                          ]}
                        >
                          {
                            area.name
                          }
                        </Text>

                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              COLORS.primary
                            }
                            style={
                              styles.chipLoader
                            }
                          />
                        ) : (
                          selected && (
                            <Text
                              style={
                                styles.check
                              }
                            >
                              ✓
                            </Text>
                          )
                        )}
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            </>
          ) : (
            <>
              <View
                style={
                  styles.searchRow
                }
              >
                <TextInput
                  style={
                    styles.searchInput
                  }
                  value={
                    searchText
                  }
                  onChangeText={
                    setSearchText
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
                    searching
                  }
                >
                  {searching ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                      size="small"
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

              {!!searchError && (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    searchError
                  }
                </Text>
              )}

              {searchedLocation && (
                <View
                  style={
                    styles.detailBox
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    검색된 위치
                  </Text>

                  <Text
                    style={
                      styles.detailTitle
                    }
                  >
                    📍 {searchText}
                  </Text>

                  <Text
                    style={
                      styles.detailSubText
                    }
                  >
                    {searchedDong}에 위치한 검색
                    지점을 기준으로 분석합니다.
                  </Text>

                  <Text
                    style={
                      styles.pendingText
                    }
                  >
                    분석 범위를 선택한 뒤 아래 버튼을 눌러
                    분석 위치로 확정해주세요.
                  </Text>

                  <View
                    style={
                      styles.searchMap
                    }
                  >
                    <AddressMap
                      latitude={
                        searchedLocation.lat
                      }
                      longitude={
                        searchedLocation.lng
                      }
                      selectedPoint={{
                        latitude:
                          searchedLocation.lat,

                        longitude:
                          searchedLocation.lng,
                      }}
                      selectedPointLabel={
                        searchText
                      }
                      radius={
                        selectedRadius
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.radiusTitle
                    }
                  >
                    분석 범위
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
                      styles.radiusGuide
                    }
                  >
                    <Text
                      style={
                        styles.radiusGuideText
                      }
                    >
                      {selectedRadius ===
                      300
                        ? '점포 주변의 매우 가까운 상권을 분석합니다.'
                        : selectedRadius ===
                            500
                          ? '일반적인 도보 생활권 범위를 분석합니다.'
                          : '넓은 생활권과 주변 상권까지 함께 분석합니다.'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.fullAddButton
                    }
                    activeOpacity={
                      0.8
                    }
                    onPress={
                      addSearchLocation
                    }
                  >
                    <Text
                      style={
                        styles.addButtonText
                      }
                    >
                      분석 위치로 추가
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* STEP 3 */}

        {totalSelected >
          0 && (
          <View
            style={
              styles.summarySection
            }
          >
            <View
              style={
                styles.summaryHeader
              }
            >
              <View
                style={
                  styles.sectionTitleArea
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
                    styles.sectionTextArea
                  }
                >
                  <Text
                    style={
                      styles.summaryTitle
                    }
                  >
                    선택한 지역
                  </Text>

                  <Text
                    style={
                      styles.sectionDescription
                    }
                  >
                    분석할 위치를 확인해주세요
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.selectedCount
                }
              >
                총 {totalSelected}개
              </Text>
            </View>

            <View
              style={
                styles.summaryChipRow
              }
            >
              {selectedAreas.map(
                area => (
                  <TouchableOpacity
                    key={
                      area
                    }
                    style={
                      styles.summaryChip
                    }
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      removeArea(
                        area,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.summaryChipText
                      }
                    >
                      {area} 전체
                    </Text>

                    <Text
                      style={
                        styles.removeText
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                ),
              )}

              {detailedLocations.map(
                (
                  location,
                  index,
                ) => (
                  <TouchableOpacity
                    key={`${location.label}-${index}`}
                    style={
                      styles.summaryChip
                    }
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      removeDetailedLocation(
                        index,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.summaryChipText
                      }
                    >
                      {
                        location.label
                      }
                      {' · '}
                      {location.radius ===
                      1000
                        ? '1km'
                        : `${location.radius}m`}
                    </Text>

                    <Text
                      style={
                        styles.removeText
                      }
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        )}

        {/* 분석 버튼 */}

        <TouchableOpacity
          style={[
            styles.analyzeButton,

            totalSelected ===
              0 &&
              styles.analyzeButtonDisabled,
          ]}
          activeOpacity={
            0.8
          }
          disabled={
            totalSelected ===
            0
          }
          onPress={
            handleAnalyze
          }
        >
          <Text
            style={[
              styles.analyzeButtonText,

              totalSelected ===
                0 &&
                styles.analyzeButtonTextDisabled,
            ]}
          >
            {totalSelected ===
            0
              ? '지역을 선택해주세요'
              : `선택한 ${totalSelected}개 지역 분석하기 →`}
          </Text>
        </TouchableOpacity>
      </View>
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

    header: {
      alignItems:
        'center',
      marginBottom:
        28,
    },

    headerTitle: {
      fontSize: 28,
      fontWeight:
        '900',
      color:
        COLORS.text,
      marginBottom:
        7,
    },

    headerSub: {
      fontSize: 14,
      color:
        COLORS.textSecondary,
      textAlign:
        'center',
    },

    headerBadge: {
      marginTop: 13,
      paddingHorizontal:
        14,
      paddingVertical:
        7,
      borderRadius:
        999,
      backgroundColor:
        '#ECFBEF',
    },

    headerBadgeText: {
      color:
        COLORS.primary,
      fontWeight:
        '800',
      fontSize: 12,
    },

    section: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },

    sectionHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 20,
    },

    sectionTitleArea: {
      flex: 1,
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    sectionTextArea: {
      flex: 1,
    },

    stepBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        COLORS.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    stepBadgeText: {
      color:
        '#FFFFFF',
      fontSize: 14,
      fontWeight:
        '900',
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        '900',
      color:
        COLORS.text,
      marginBottom: 4,
    },

    sectionDescription: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
      lineHeight: 17,
    },

    selectedCount: {
      fontSize: 12,
      fontWeight:
        '800',
      color:
        COLORS.primary,
      paddingTop: 4,
    },

    modeRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 10,
    },

    modeButton: {
      flexGrow: 1,
      flexBasis: 240,
      minHeight: 76,
      flexDirection:
        'row',
      alignItems:
        'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        '#FAFAFA',
    },

    modeButtonActive: {
      borderColor:
        COLORS.primary,
      backgroundColor:
        '#F1FFF5',
    },

    modeIcon: {
      fontSize: 22,
      marginRight: 12,
    },

    modeLoading: {
      marginRight: 12,
    },

    modeTextArea: {
      flex: 1,
    },

    modeTitle: {
      fontSize: 14,
      fontWeight:
        '800',
      color:
        COLORS.textSecondary,
      marginBottom: 3,
    },

    modeTitleActive: {
      color:
        COLORS.primary,
    },

    modeDescription: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    mapContainer: {
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      borderRadius: 16,
      overflow:
        'hidden',
      marginBottom: 12,
    },

    mapHeader: {
      padding: 14,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      backgroundColor:
        '#FAFBFA',
      gap: 10,
    },

    mapHeaderTextArea: {
      flex: 1,
    },

    mapTitle: {
      fontSize: 14,
      fontWeight:
        '900',
      color:
        COLORS.text,
      marginBottom: 3,
    },

    mapDescription: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    mapHint: {
      fontSize: 11,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    mapArea: {
      height: 330,
    },

    currentLocationButton: {
      flexDirection:
        'row',
      alignItems:
        'center',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#CFE9D6',
      backgroundColor:
        '#F7FFF9',
      marginBottom: 16,
    },

    currentLocationIcon: {
      fontSize: 22,
      marginRight: 12,
    },

    currentLocationTextArea: {
      flex: 1,
      marginLeft: 10,
    },

    currentLocationTitle: {
      fontSize: 13,
      fontWeight:
        '900',
      color:
        COLORS.primary,
      marginBottom: 3,
    },

    currentLocationDescription: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    loadingBox: {
      flexDirection:
        'row',
      gap: 8,
      alignItems:
        'center',
      padding: 13,
      marginBottom: 14,
      borderRadius: 12,
      backgroundColor:
        '#F5F8F5',
    },

    loadingText: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    detailBox: {
      borderWidth: 1,
      borderColor:
        '#DCEFE0',
      borderRadius: 16,
      backgroundColor:
        '#FAFFFB',
      padding: 17,
      marginBottom: 18,
    },

    detailLabel: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
      marginBottom: 5,
    },

    detailTitle: {
      fontSize: 16,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    detailSubText: {
      marginTop: 5,
      fontSize: 11,
      lineHeight: 17,
      color:
        COLORS.textSecondary,
    },

    accuracyText: {
      marginTop: 5,
      fontSize: 11,
      fontWeight:
        '700',
      color:
        COLORS.primary,
    },

    pendingText: {
      marginTop: 8,
      marginBottom: 16,
      fontSize: 11,
      lineHeight: 17,
      color:
        '#6B7280',
      fontWeight:
        '600',
    },

    unsupportedText: {
      marginTop: 7,
      marginBottom: 16,
      fontSize: 11,
      lineHeight: 17,
      color:
        '#DC2626',
      fontWeight:
        '700',
    },

    radiusTitle: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        COLORS.text,
      marginBottom: 10,
    },

    radiusRow: {
      flexDirection:
        'row',
      gap: 9,
      marginBottom: 10,
    },

    radiusButton: {
      flex: 1,
      alignItems:
        'center',
      paddingVertical:
        11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        COLORS.border,
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
      fontSize: 13,
      color:
        COLORS.textSecondary,
      fontWeight:
        '700',
    },

    radiusTextActive: {
      color:
        COLORS.primary,
      fontWeight:
        '900',
    },

    radiusGuide: {
      padding: 10,
      borderRadius: 10,
      backgroundColor:
        '#F5F8F5',
      marginBottom: 14,
    },

    radiusGuideText: {
      fontSize: 10,
      lineHeight: 15,
      color:
        COLORS.textSecondary,
    },

    detailButtonRow: {
      flexDirection:
        'row',
      gap: 10,
    },

    cancelButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#FFFFFF',
    },

    cancelButtonText: {
      fontSize: 14,
      fontWeight:
        '800',
      color:
        COLORS.textSecondary,
    },

    addButton: {
      flex: 2,
      minHeight: 48,
      borderRadius: 13,
      backgroundColor:
        COLORS.neonLime,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    addButtonDisabled: {
      backgroundColor:
        COLORS.disabled,
    },

    fullAddButton: {
      minHeight: 48,
      borderRadius: 13,
      backgroundColor:
        COLORS.neonLime,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    addButtonText: {
      fontSize: 14,
      fontWeight:
        '900',
      color:
        '#111111',
    },

    addButtonTextDisabled: {
      color:
        '#9CA3AF',
    },

    quickTitle: {
      fontSize: 14,
      fontWeight:
        '800',
      color:
        COLORS.text,
      marginBottom: 4,
    },

    quickDescription: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
      marginBottom: 12,
    },

    chipRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 9,
    },

    regionChip: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingVertical:
        10,
      paddingHorizontal:
        15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        '#FFFFFF',
    },

    regionChipSelected: {
      borderColor:
        COLORS.primary,
      backgroundColor:
        '#F0FFF4',
    },

    regionText: {
      fontSize: 13,
      fontWeight:
        '600',
      color:
        COLORS.textSecondary,
    },

    regionTextSelected: {
      color:
        COLORS.primary,
      fontWeight:
        '800',
    },

    check: {
      marginLeft: 7,
      color:
        COLORS.primary,
      fontWeight:
        '900',
    },

    chipLoader: {
      marginLeft: 7,
    },

    searchRow: {
      flexDirection:
        'row',
      gap: 10,
    },

    searchInput: {
      flex: 1,
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal:
        15,
      fontSize: 14,
      color:
        COLORS.text,
    },

    searchButton: {
      minWidth: 80,
      borderRadius: 14,
      backgroundColor:
        COLORS.primary,
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
      fontSize: 13,
    },

    errorText: {
      color:
        '#DC2626',
      fontSize: 12,
      marginTop: 10,
    },

    searchMap: {
      height: 280,
      overflow:
        'hidden',
      borderRadius: 14,
      marginVertical: 16,
    },

    summarySection: {
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#DCEFE0',
      backgroundColor:
        '#F5FCF6',
      marginBottom: 16,
    },

    summaryHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 16,
    },

    summaryTitle: {
      fontSize: 16,
      fontWeight:
        '900',
      color:
        COLORS.text,
      marginBottom: 4,
    },

    summaryChipRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    summaryChip: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingVertical:
        8,
      paddingHorizontal:
        12,
      borderRadius:
        999,
      backgroundColor:
        '#E9F8EC',
    },

    summaryChipText: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        COLORS.primary,
    },

    removeText: {
      marginLeft: 7,
      fontSize: 15,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    analyzeButton: {
      minHeight: 56,
      borderRadius: 16,
      backgroundColor:
        COLORS.neonLime,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    analyzeButtonDisabled: {
      backgroundColor:
        COLORS.disabled,
    },

    analyzeButtonText: {
      fontSize: 16,
      fontWeight:
        '900',
      color:
        '#111111',
    },

    analyzeButtonTextDisabled: {
      color:
        '#9CA3AF',
    },
  });
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
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type SelectMode = 'map' | 'direct';

type Radius = 300 | 500 | 1000;

interface DetailedLocation {
  label: string;
  dongName: string;
  coordinates: Coordinates;
  radius: Radius;
}

export default function RegionSelectionScreen() {
  const router = useRouter();

  const { businesses } =
    useLocalSearchParams<{
      businesses: string;
    }>();

  // 선택 방식
  const [selectMode, setSelectMode] =
    useState<SelectMode>('map');

  // 동 전체 선택
  const [selectedAreas, setSelectedAreas] =
    useState<string[]>([]);

  // 선택된 동들의 지도 마커
  const [areaMarkers, setAreaMarkers] =
    useState<MapMarkerData[]>([]);

  const [loadingArea, setLoadingArea] =
    useState<string | null>(null);

  // 지도에서 직접 찍은 위치
  const [mapSelectedPoint, setMapSelectedPoint] =
    useState<Coordinates | null>(null);

  const [mapSelectedDong, setMapSelectedDong] =
    useState('');

  const [mapPointLoading, setMapPointLoading] =
    useState(false);

  // 직접 검색
  const [searchText, setSearchText] =
    useState('');

  const [searchedLocation, setSearchedLocation] =
    useState<Coordinates | null>(null);

  const [searchedDong, setSearchedDong] =
    useState('');

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState('');

  // 분석 반경
  const [selectedRadius, setSelectedRadius] =
    useState<Radius>(500);

  // 추가 완료된 세부 위치
  const [detailedLocations, setDetailedLocations] =
    useState<DetailedLocation[]>([]);

  // 세종시 기본 중심
  const SEJONG_CENTER = {
    latitude: 36.48,
    longitude: 127.289,
  };

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
   * 동 전체 선택 / 해제
   */
  const toggleArea = async (
    name: string,
  ) => {
    // 이미 선택되어 있으면 제거
    if (selectedAreas.includes(name)) {
      setSelectedAreas(prev =>
        prev.filter(area => area !== name),
      );

      setAreaMarkers(prev =>
        prev.filter(marker => marker.name !== name),
      );

      return;
    }

    try {
      setLoadingArea(name);

      const result =
        await searchLocation(
          `세종특별자치시 ${name}`,
        );

      setSelectedAreas(prev => [
        ...prev,
        name,
      ]);

      if (result) {
        setAreaMarkers(prev => [
          ...prev,
          {
            name,
            latitude: result.lat,
            longitude: result.lng,
          },
        ]);
      }
    } catch (error) {
      console.error(
        '동 위치 검색 실패:',
        error,
      );
    } finally {
      setLoadingArea(null);
    }
  };

  /**
   * 지도 클릭
   */
  const handleMapPress =
    useCallback(
      async (
        latitude: number,
        longitude: number,
      ) => {
        try {
          setMapPointLoading(true);

          const dong =
            await getDongFromCoords(
              latitude,
              longitude,
            );

          if (!dong) {
            alert(
              '행정동 정보를 찾을 수 없습니다.',
            );

            return;
          }

          const supported =
            sejongAreas.some(
              area =>
                area.name === dong.dongName,
            );

          if (!supported) {
            alert(
              '현재는 지원되는 세종시 지역만 선택할 수 있습니다.',
            );

            return;
          }

          setMapSelectedPoint({
            lat: latitude,
            lng: longitude,
          });

          setMapSelectedDong(
            dong.dongName,
          );
        } catch (error) {
          console.error(
            '지도 위치 확인 실패:',
            error,
          );

          alert(
            '위치 정보를 확인하지 못했습니다.',
          );
        } finally {
          setMapPointLoading(false);
        }
      },
      [],
    );

  /**
   * 지도에서 선택한 세부 위치 추가
   */
  const addMapLocation = () => {
    if (
      !mapSelectedPoint ||
      !mapSelectedDong
    ) {
      return;
    }

    const exists =
      detailedLocations.some(
        location =>
          location.coordinates.lat ===
            mapSelectedPoint.lat &&
          location.coordinates.lng ===
            mapSelectedPoint.lng &&
          location.radius ===
            selectedRadius,
      );

    if (exists) {
      return;
    }

    setDetailedLocations(prev => [
      ...prev,
      {
        label: `${mapSelectedDong} 선택 위치`,
        dongName: mapSelectedDong,
        coordinates: mapSelectedPoint,
        radius: selectedRadius,
      },
    ]);

    // 추가 완료 후 임시 선택 초기화
    setMapSelectedPoint(null);
    setMapSelectedDong('');
  };

  /**
   * 직접 위치 검색
   */
  const handleSearch = async () => {
    const query =
      searchText.trim();

    if (!query) {
      return;
    }

    try {
      setSearching(true);
      setSearchError('');

      setSearchedLocation(null);
      setSearchedDong('');

      let searchQuery = query;

      if (
        !query.includes('세종')
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
            area.name === dong.dongName,
        );

      if (!supported) {
        setSearchError(
          '현재는 지원되는 세종시 지역만 선택할 수 있습니다.',
        );

        return;
      }

      setSearchedLocation(result);
      setSearchedDong(
        dong.dongName,
      );
    } catch (error) {
      console.error(
        '위치 검색 실패:',
        error,
      );

      setSearchError(
        '위치 검색 중 오류가 발생했습니다.',
      );
    } finally {
      setSearching(false);
    }
  };

  /**
   * 검색 위치 추가
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
        return;
      }

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

      setSearchText('');
      setSearchedLocation(null);
      setSearchedDong('');
    };

  /**
   * 동 전체 삭제
   */
  const removeArea = (
    name: string,
  ) => {
    setSelectedAreas(prev =>
      prev.filter(
        area => area !== name,
      ),
    );

    setAreaMarkers(prev =>
      prev.filter(
        marker =>
          marker.name !== name,
      ),
    );
  };

  /**
   * 세부 위치 삭제
   */
  const removeDetailedLocation =
    (index: number) => {
      setDetailedLocations(
        prev =>
          prev.filter(
            (_, i) => i !== index,
          ),
      );
    };

  /**
   * 분석 화면 이동
   */
  const handleAnalyze =
    () => {
      if (
        totalSelected === 0
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            지역 선택
          </Text>

          <Text style={styles.headerSub}>
            분석하고 싶은 세종시 지역을
            선택해주세요
          </Text>

          <View
            style={styles.headerBadge}
          >
            <Text
              style={
                styles.headerBadgeText
              }
            >
              동 또는 세부 위치 선택 가능
            </Text>
          </View>
        </View>

        {/* STEP 1 */}
        <View style={styles.section}>
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

              <View>
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
                  지도에서 직접 선택하거나
                  주소를 검색해주세요
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

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,

                selectMode ===
                  'map' &&
                  styles.modeButtonActive,
              ]}
              activeOpacity={0.8}
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

              <View>
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
                  'direct' &&
                  styles.modeButtonActive,
              ]}
              activeOpacity={0.8}
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

              <View>
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
        <View style={styles.section}>
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

              <View>
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
                  'map'
                    ? '동을 선택하거나 지도에서 원하는 위치를 클릭하세요'
                    : '주소나 건물명을 검색하세요'}
                </Text>
              </View>
            </View>
          </View>

          {selectMode ===
          'map' ? (
            <>
              {/* MAP */}
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
                  <View>
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
                      지도를 클릭하면 세부 위치를
                      지정할 수 있어요
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
                      SEJONG_CENTER.latitude
                    }
                    longitude={
                      SEJONG_CENTER.longitude
                    }

                    // 세부 위치 선택 중이면
                    // 기존 동 마커는 숨김
                    markers={
                      mapSelectedPoint
                        ? []
                        : areaMarkers
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

                    radius={
                      selectedRadius
                    }
                  />
                </View>
              </View>

              {/* 위치 확인 중 */}
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

              {/* 지도에서 선택한 임시 위치 */}
              {mapSelectedPoint &&
                mapSelectedDong && (
                  <View
                    style={
                      styles.detailBox
                    }
                  >
                    <View
                      style={
                        styles.detailHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          지도에서 선택한 위치
                        </Text>

                        <Text
                          style={
                            styles.detailTitle
                          }
                        >
                          📍 {mapSelectedDong}
                        </Text>

                        <Text
                          style={
                            styles.pendingText
                          }
                        >
                          아직 분석 지역에
                          추가되지 않았습니다.
                        </Text>
                      </View>
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

                    <TouchableOpacity
                      style={
                        styles.addButton
                      }
                      activeOpacity={0.8}
                      onPress={
                        addMapLocation
                      }
                    >
                      <Text
                        style={
                          styles.addButtonText
                        }
                      >
                        이 위치 추가하기
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {/* 동 전체 */}
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
                세부 위치가 아닌 행정동 전체를
                분석할 수도 있어요
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
                          loadingArea ===
                          area.name
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

                        {loadingArea ===
                        area.name ? (
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
              {/* SEARCH */}
              <View
                style={
                  styles.searchRow
                }
              >
                <TextInput
                  style={
                    styles.searchInput
                  }
                  value={searchText}
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
                  activeOpacity={0.8}
                  onPress={
                    handleSearch
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
                      styles.dongText
                    }
                  >
                    {searchedDong}
                  </Text>

                  <Text
                    style={
                      styles.pendingText
                    }
                  >
                    아직 분석 지역에
                    추가되지 않았습니다.
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

                  <TouchableOpacity
                    style={
                      styles.addButton
                    }
                    activeOpacity={0.8}
                    onPress={
                      addSearchLocation
                    }
                  >
                    <Text
                      style={
                        styles.addButtonText
                      }
                    >
                      이 위치 추가하기
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* STEP 3 */}
        {totalSelected > 0 && (
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

                <View>
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
                    분석할 위치를
                    확인해주세요
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
              {/* 동 전체 */}
              {selectedAreas.map(
                area => (
                  <TouchableOpacity
                    key={area}
                    style={
                      styles.summaryChip
                    }
                    activeOpacity={0.7}
                    onPress={() =>
                      removeArea(area)
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

              {/* 세부 위치 */}
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
                    activeOpacity={0.7}
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
                      {location.label}
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

        {/* ANALYZE BUTTON */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,

            totalSelected === 0 &&
              styles.analyzeButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={
            totalSelected === 0
          }
          onPress={
            handleAnalyze
          }
        >
          <Text
            style={[
              styles.analyzeButtonText,

              totalSelected === 0 &&
                styles.analyzeButtonTextDisabled,
            ]}
          >
            {totalSelected === 0
              ? '지역을 선택해주세요'
              : `선택한 ${totalSelected}개 지역 분석하기 →`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  scrollContent: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 50,
  },

  content: {
    width: '100%',
    maxWidth: 900,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 7,
  },

  headerSub: {
    fontSize: 14,
    color:
      COLORS.textSecondary,
  },

  headerBadge: {
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      '#ECFBEF',
  },

  headerBadgeText: {
    color:
      COLORS.primary,
    fontWeight: '800',
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
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    marginBottom: 20,
  },

  sectionTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems:
      'flex-start',
  },

  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      COLORS.primary,
    alignItems: 'center',
    justifyContent:
      'center',
    marginRight: 11,
  },

  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    color:
      COLORS.textSecondary,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color:
      COLORS.primary,
    paddingTop: 4,
  },

  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  modeButton: {
    flex: 1,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
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

  modeTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    overflow: 'hidden',
    marginBottom: 16,
  },

  mapHeader: {
    padding: 14,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    backgroundColor:
      '#FAFBFA',
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 3,
  },

  mapDescription: {
    fontSize: 11,
    color:
      COLORS.textSecondary,
  },

  mapHint: {
    fontSize: 11,
    fontWeight: '800',
    color:
      COLORS.primary,
  },

  mapArea: {
    height: 330,
  },

  loadingBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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

  detailHeader: {
    marginBottom: 14,
  },

  detailLabel: {
    fontSize: 11,
    color:
      COLORS.textSecondary,
    marginBottom: 5,
  },

  detailTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },

  pendingText: {
    marginTop: 6,
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },

  dongText: {
    fontSize: 12,
    color:
      COLORS.primary,
    fontWeight: '700',
    marginTop: 5,
  },

  radiusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },

  radiusRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },

  radiusButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
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
    fontWeight: '700',
  },

  radiusTextActive: {
    color:
      COLORS.primary,
    fontWeight: '900',
  },

  addButton: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor:
      COLORS.neonLime,
    justifyContent:
      'center',
    alignItems: 'center',
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },

  quickDescription: {
    fontSize: 11,
    color:
      COLORS.textSecondary,
    marginBottom: 12,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
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
    fontWeight: '600',
    color:
      COLORS.textSecondary,
  },

  regionTextSelected: {
    color:
      COLORS.primary,
    fontWeight: '800',
  },

  check: {
    marginLeft: 7,
    color:
      COLORS.primary,
    fontWeight: '900',
  },

  chipLoader: {
    marginLeft: 7,
  },

  searchRow: {
    flexDirection: 'row',
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
    paddingHorizontal: 15,
    fontSize: 14,
    color: COLORS.text,
  },

  searchButton: {
    minWidth: 80,
    borderRadius: 14,
    backgroundColor:
      COLORS.primary,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 10,
  },

  searchMap: {
    height: 280,
    overflow: 'hidden',
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
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    marginBottom: 16,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  summaryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor:
      '#E9F8EC',
  },

  summaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color:
      COLORS.primary,
  },

  removeText: {
    marginLeft: 7,
    fontSize: 15,
    fontWeight: '800',
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
    alignItems: 'center',
  },

  analyzeButtonDisabled: {
    backgroundColor:
      COLORS.disabled,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
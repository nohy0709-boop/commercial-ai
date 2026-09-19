import AddressMap, {
  MapMarkerData,
} from '@/components/address-map';

import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import { searchLocation } from '@/services/geocoding';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SuitabilityRegionScreen() {
  const router = useRouter();

  const {
    businessName,
    lclsCode,
    mclsCode,
    sclsCode,
  } =
    useLocalSearchParams<{
      businessName: string;
      lclsCode: string;
      mclsCode: string;
      sclsCode: string;
    }>();

  // 선택한 지역
  const [selectedAreas, setSelectedAreas] =
    useState<string[]>([]);

  // 지도에 표시할 마커
  const [areaMarkers, setAreaMarkers] =
    useState<MapMarkerData[]>([]);

  // 현재 좌표 검색 중인 지역
  const [loadingArea, setLoadingArea] =
    useState<string | null>(null);

  const SEJONG_CENTER = {
    latitude: 36.48,
    longitude: 127.289,
  };

  /**
   * 지역 선택 / 해제
   */
  const toggleArea = async (
    name: string,
  ) => {
    /**
     * 이미 선택된 경우
     * → 지역과 마커 제거
     */
    if (selectedAreas.includes(name)) {
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

      return;
    }

    /**
     * 신규 선택
     */
    try {
      setLoadingArea(name);

      const location =
        await searchLocation(
          `세종특별자치시 ${name}`,
        );

      setSelectedAreas(prev => [
        ...prev,
        name,
      ]);

      if (location) {
        setAreaMarkers(prev => [
          ...prev,
          {
            name,
            latitude: location.lat,
            longitude: location.lng,
          },
        ]);
      }
    } catch (error) {
      console.error(
        '지역 위치 검색 실패:',
        error,
      );
    } finally {
      setLoadingArea(null);
    }
  };

  /**
   * 선택한 지역 삭제
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
   * 적합성 분석
   */
  const handleAnalyze = () => {
    if (
      selectedAreas.length === 0
    ) {
      return;
    }

    router.push({
      pathname:
        '/market-analysis/result',

      params: {
        businessName,
        lclsCode,
        mclsCode,
        sclsCode,

        areas:
          selectedAreas.join(','),
      },
    });
  };

  return (
    <View style={styles.screen}>
      {/* 상단 앱바 + 스테퍼 */}
      <View style={styles.appBar}>
        <View style={styles.appBarTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>지역 선택</Text>
        </View>

        <View style={styles.stepper}>
          <Text style={styles.stepDone}>✓ 1 업종 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepActive}>2 지역 선택</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>3 분석 결과</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        {/* HEADER */}
        <View
          style={styles.headerSection}
        >
          <Text
            style={styles.smallTitle}
          >
            업종 + 입지 적합성 분석
          </Text>

          <Text style={styles.header}>
            분석 지역 선택
          </Text>

          <Text
            style={styles.description}
          >
            <Text
              style={styles.businessName}
            >
              {businessName}
            </Text>

            {
              ' 업종과 잘 맞는지 확인할 지역을 선택해주세요.'
            }
          </Text>

          <View style={styles.badge}>
            <Text
              style={styles.badgeText}
            >
              여러 개 선택 가능
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
                style={styles.stepBadge}
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
                  지역 선택
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  분석하고 싶은 세종시 지역을
                  선택해주세요
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.selectedCount
              }
            >
              {selectedAreas.length}개 선택
            </Text>
          </View>

          {/* 지도 */}
          <View
            style={
              styles.mapContainer
            }
          >
            <View
              style={styles.mapHeader}
            >
              <View>
                <Text
                  style={styles.mapTitle}
                >
                  세종시 지도
                </Text>

                <Text
                  style={
                    styles.mapDescription
                  }
                >
                  선택한 지역이 지도에
                  표시됩니다
                </Text>
              </View>

              <View
                style={
                  styles.mapCountBadge
                }
              >
                <Text
                  style={
                    styles.mapCountText
                  }
                >
                  {selectedAreas.length}개
                </Text>
              </View>
            </View>

            <View style={styles.mapArea}>
              <AddressMap
                latitude={
                  SEJONG_CENTER.latitude
                }
                longitude={
                  SEJONG_CENTER.longitude
                }
                markers={areaMarkers}
              />
            </View>
          </View>

          {/* 지역 선택 */}
          <View
            style={styles.regionHeader}
          >
            <View>
              <Text
                style={styles.regionTitle}
              >
                동 선택하기
              </Text>

              <Text
                style={
                  styles.regionDescription
                }
              >
                비교하고 싶은 지역을 여러 개
                선택할 수 있어요
              </Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            {sejongAreas.map(area => {
              const selected =
                selectedAreas.includes(
                  area.name,
                );

              const loading =
                loadingArea === area.name;

              return (
                <TouchableOpacity
                  key={area.code}
                  style={[
                    styles.regionChip,
                    selected &&
                      styles.regionChipSelected,
                  ]}
                  activeOpacity={0.7}
                  disabled={loading}
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
                    {area.name}
                  </Text>

                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                      style={styles.loader}
                    />
                  ) : (
                    selected && (
                      <Text
                        style={styles.check}
                      >
                        ✓
                      </Text>
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* STEP 2 */}
        {selectedAreas.length > 0 && (
          <View
            style={
              styles.summarySection
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
                  style={styles.stepBadge}
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
                    선택한 지역
                  </Text>

                  <Text
                    style={
                      styles.sectionDescription
                    }
                  >
                    적합성을 비교할 지역을
                    확인해주세요
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.selectedCount
                }
              >
                총 {selectedAreas.length}개
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
                      📍 {area}
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

        {/* 분석 정보 */}
        {selectedAreas.length > 0 && (
          <View style={styles.infoBox}>
            <View
              style={
                styles.infoIconBox
              }
            >
              <Text
                style={styles.infoIcon}
              >
                ✓
              </Text>
            </View>

            <View
              style={styles.infoTextArea}
            >
              <Text
                style={styles.infoTitle}
              >
                분석 대상
              </Text>

              <Text
                style={
                  styles.infoDescription
                }
              >
                {businessName} ×{' '}
                {selectedAreas.join(
                  ', ',
                )}
              </Text>
            </View>
          </View>
        )}

        {/* BUTTON */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,

            selectedAreas.length ===
              0 &&
              styles.analyzeButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={
            selectedAreas.length ===
            0
          }
          onPress={handleAnalyze}
        >
          <Text
            style={[
              styles.analyzeButtonText,

              selectedAreas.length ===
                0 &&
                styles.analyzeButtonTextDisabled,
            ]}
          >
            {selectedAreas.length ===
            0
              ? '분석할 지역을 선택해주세요'
              : `선택한 ${selectedAreas.length}개 지역 적합성 분석하기 →`}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  appBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  stepDone: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  stepActive: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  stepInactive: { fontSize: 12, color: '#9CA3AF' },
  stepArrow: { fontSize: 12, color: '#9CA3AF' },

  scroll: { flex: 1 },

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

  /* HEADER */

  headerSection: {
    marginTop: 4,
    marginBottom: 22,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },

  header: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  businessName: {
    fontWeight: '900',
    color: COLORS.text,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  /* SECTION */

  section: {
    padding: 20,
    marginBottom: 16,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  sectionTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 12,
  },

  stepBadge: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  stepBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  selectedCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    paddingTop: 4,
  },

  /* MAP */

  mapContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 16,

    overflow: 'hidden',

    marginBottom: 20,
  },

  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    padding: 14,

    backgroundColor: COLORS.background,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  mapTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 3,
  },

  mapDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  mapCountBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,

    borderRadius: 999,

    backgroundColor: COLORS.primaryLight,
  },

  mapCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  mapArea: {
    height: 330,
    backgroundColor: COLORS.background,
  },

  /* REGION */

  regionHeader: {
    marginBottom: 12,
  },

  regionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 3,
  },

  regionDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,
  },

  regionChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  regionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  regionTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  check: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  loader: {
    marginLeft: 7,
  },

  /* SUMMARY */

  summarySection: {
    padding: 20,
    marginBottom: 16,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.primaryLight,
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
    paddingLeft: 12,
    paddingRight: 10,

    borderRadius: 999,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  summaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  removeText: {
    marginLeft: 7,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },

  /* INFO */

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 16,
    marginBottom: 16,

    borderRadius: 16,

    backgroundColor: COLORS.background,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoIconBox: {
    width: 34,
    height: 34,

    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primaryLight,

    marginRight: 11,
  },

  infoIcon: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },

  infoTextArea: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  infoDescription: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  /* BUTTON */

  analyzeButton: {
    minHeight: 56,

    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,
  },

  analyzeButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  analyzeButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
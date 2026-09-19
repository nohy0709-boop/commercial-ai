import AddressMap from '@/components/address-map';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { Coordinates } from '@/services/geocoding';
import {
  getDongFromCoords,
  searchLocation,
} from '@/services/geocoding';

import { useRouter } from 'expo-router';

import { useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Radius = 300 | 500 | 1000;

export default function LocationRecommendScreen() {
  const router = useRouter();

  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [coords, setCoords] =
    useState<Coordinates | null>(null);

  const [matchedDong, setMatchedDong] =
    useState<string | null>(null);

  const [selectedRadius, setSelectedRadius] =
    useState<Radius>(500);

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
   * 주소 / 건물명 검색
   */
  const handleSearch = async () => {
    Keyboard.dismiss();

    const query = address.trim();

    if (!query) {
      setErrorMessage(
        '보유한 장소의 주소나 건물명을 입력해주세요.',
      );

      return;
    }

    try {
      setLoading(true);

      setErrorMessage('');
      setCoords(null);
      setMatchedDong(null);

      /**
       * 사용자가
       * "나성동 주민센터"
       * 같은 식으로 입력했을 때
       * 세종을 자동으로 붙여줌
       */
      let searchQuery = query;

      if (!query.includes('세종')) {
        searchQuery =
          `세종특별자치시 ${query}`;
      }

      /**
       * 주소 검색
       * → 실패하면 키워드 검색
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
       * 좌표 → 행정동 확인
       */
      const region =
        await getDongFromCoords(
          location.lat,
          location.lng,
        );

      if (!region) {
        setErrorMessage(
          '해당 위치의 행정동 정보를 확인할 수 없습니다.',
        );

        return;
      }

      /**
       * 현재 프로젝트가 지원하는
       * 세종시 행정동인지 확인
       */
      const known =
        sejongAreas.find(
          area =>
            area.name ===
            region.dongName,
        );

      if (!known) {
        setErrorMessage(
          `'${region.dongName}'은(는) 아직 분석을 지원하지 않는 지역입니다.`,
        );

        return;
      }

      setCoords(location);
      setMatchedDong(known.name);
    } catch (error) {
      console.error(
        '보유 장소 검색 오류:',
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
   * 업종 추천 결과 화면으로 이동
   */
  const handleAnalyze = () => {
    if (
      !coords ||
      !matchedDong
    ) {
      return;
    }

    router.push({
      pathname:
        '/market-analysis/location-recommend-result',

      params: {
        region: matchedDong,

        address: address.trim(),

        latitude:
          String(coords.lat),

        longitude:
          String(coords.lng),

        radius:
          String(selectedRadius),
      },
    });
  };

  /**
   * 새 주소 다시 입력
   */
  const handleReset = () => {
    setCoords(null);
    setMatchedDong(null);
    setErrorMessage('');
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
          <Text style={styles.appBarTitle}>보유 입지 업종 추천</Text>
        </View>

        <View style={styles.stepper}>
          <Text style={styles.stepActive}>1 장소 입력</Text>
          <Text style={styles.stepArrow}>›</Text>
          <Text style={styles.stepInactive}>2 추천 결과</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.headerSection}>
          <Text style={styles.smallTitle}>
            장기 상권 분석
          </Text>

          <Text style={styles.description}>
            보유하고 있는 점포나 건물의
            주소를 입력하면 해당 위치 주변에
            적합한 업종을 추천해드려요.
          </Text>

          <View style={styles.accentLine} />
        </View>

        {/* STEP 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                1
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                보유 장소 입력
              </Text>

              <Text
                style={styles.sectionDescription}
              >
                주소 또는 건물명을 입력해주세요
              </Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={text => {
                setAddress(text);

                if (coords) {
                  handleReset();
                }
              }}
              placeholder="예: 정부세종청사, 세종시 나성동 123"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            <TouchableOpacity
              style={styles.searchButton}
              activeOpacity={0.8}
              onPress={handleSearch}
              disabled={loading}
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
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}
        </View>

        {/* STEP 2 */}
        {coords && matchedDong && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text
                  style={styles.stepBadgeText}
                >
                  2
                </Text>
              </View>

              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  위치 확인
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  검색한 보유 장소가 맞는지
                  지도에서 확인해주세요
                </Text>
              </View>
            </View>

            <View style={styles.mapContainer}>
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.mapTitle}>
                    검색된 위치
                  </Text>

                  <Text
                    style={
                      styles.mapDescription
                    }
                  >
                    {address}
                  </Text>
                </View>

                <View style={styles.dongBadge}>
                  <Text
                    style={
                      styles.dongBadgeText
                    }
                  >
                    {matchedDong}
                  </Text>
                </View>
              </View>

              <View style={styles.mapArea}>
                <AddressMap
                  latitude={coords.lat}
                  longitude={coords.lng}
                  selectedPoint={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                  }}
                  radius={selectedRadius}
                />
              </View>
            </View>

            <View style={styles.locationInfo}>
              <Text
                style={styles.locationInfoLabel}
              >
                입력한 장소
              </Text>

              <Text
                style={styles.locationInfoValue}
              >
                📍 {address}
              </Text>

              <Text
                style={
                  styles.locationInfoDescription
                }
              >
                세종특별자치시 {matchedDong}으로
                인식되었습니다.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {coords && matchedDong && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text
                  style={styles.stepBadgeText}
                >
                  3
                </Text>
              </View>

              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  분석 범위 선택
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  보유 장소 주변 어느 범위까지
                  분석할지 선택해주세요
                </Text>
              </View>
            </View>

            <View style={styles.radiusRow}>
              {radiusOptions.map(
                option => {
                  const active =
                    selectedRadius ===
                    option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.radiusButton,

                        active &&
                          styles.radiusButtonActive,
                      ]}
                      activeOpacity={0.8}
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
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

            <View style={styles.radiusHelp}>
              <Text
                style={styles.radiusHelpText}
              >
                {selectedRadius === 300 &&
                  '점포 바로 주변의 근거리 상권을 중심으로 분석합니다.'}

                {selectedRadius === 500 &&
                  '도보권 중심의 일반적인 생활 상권을 분석합니다.'}

                {selectedRadius === 1000 &&
                  '주변 주요 상권까지 넓게 포함하여 분석합니다.'}
              </Text>
            </View>
          </View>
        )}

        {/* SUMMARY */}
        {coords && matchedDong && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>
              분석할 보유 입지
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryTextArea}>
                <Text style={styles.summaryTitle}>
                  {address}
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  {matchedDong} ·{' '}
                  {selectedRadius === 1000
                    ? '반경 1km'
                    : `반경 ${selectedRadius}m`}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setAddress('');
                  handleReset();
                }}
              >
                <Text style={styles.removeText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ANALYZE */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,

            (!coords ||
              !matchedDong) &&
              styles.analyzeButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={
            !coords ||
            !matchedDong
          }
          onPress={handleAnalyze}
        >
          <Text
            style={[
              styles.analyzeButtonText,

              (!coords ||
                !matchedDong) &&
                styles.analyzeButtonTextDisabled,
            ]}
          >
            {coords && matchedDong
              ? '이 위치 기준 업종 추천받기 →'
              : '보유 장소를 입력해주세요'}
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

  description: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },

  accentLine: {
    width: 34,
    height: 4,
    marginTop: 14,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  section: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
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
    color: COLORS.textSecondary,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 50,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,

    paddingHorizontal: 15,

    backgroundColor: COLORS.surface,

    color: COLORS.text,
    fontSize: 14,
  },

  searchButton: {
    minWidth: 80,
    minHeight: 50,

    paddingHorizontal: 18,

    borderRadius: 14,

    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  errorBox: {
    marginTop: 12,
    padding: 13,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: COLORS.danger,

    backgroundColor: COLORS.dangerLight,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.danger,
  },

  mapContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 16,

    overflow: 'hidden',
  },

  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    padding: 14,

    backgroundColor: COLORS.background,
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

  mapArea: {
    height: 330,
  },

  dongBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: COLORS.primaryLight,
  },

  dongBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  locationInfo: {
    marginTop: 14,

    padding: 15,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 14,

    backgroundColor: COLORS.primaryLight,
  },

  locationInfoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  locationInfoValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  locationInfoDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  radiusRow: {
    flexDirection: 'row',
    gap: 9,
  },

  radiusButton: {
    flex: 1,

    paddingVertical: 12,

    alignItems: 'center',

    borderRadius: 13,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.surface,
  },

  radiusButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  radiusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  radiusTextActive: {
    fontWeight: '900',
    color: COLORS.primary,
  },

  radiusHelp: {
    marginTop: 12,

    padding: 12,

    borderRadius: 12,

    backgroundColor: COLORS.background,
  },

  radiusHelpText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  summarySection: {
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 18,

    backgroundColor: COLORS.primaryLight,
  },

  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 9,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryTextArea: {
    flex: 1,
    paddingRight: 15,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },

  summaryDescription: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  removeText: {
    fontSize: 22,
    fontWeight: '500',
    color: COLORS.primary,
  },

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
import AddressMap from '@/components/address-map';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import type { Coordinates } from '@/services/geocoding';
import { getDongFromCoords, searchAddress } from '@/services/geocoding';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function AddressInputScreen() {
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [coords, setCoords] =
    useState<Coordinates | null>(null);

  const [matchedDong, setMatchedDong] =
    useState<string | null>(null);

  const handleSearch = async () => {
    Keyboard.dismiss();

    if (!address.trim()) {
      setErrorMessage('주소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      setErrorMessage('');
      setMatchedDong(null);
      setCoords(null);

      const location = await searchAddress(
        address.trim(),
      );

      if (!location) {
        setErrorMessage(
          '주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.',
        );
        return;
      }

      setCoords(location);

      const region = await getDongFromCoords(
        location.lat,
        location.lng,
      );

      if (!region) {
        setErrorMessage(
          '행정동 정보를 확인할 수 없습니다.',
        );
        return;
      }

      const known = sejongAreas.find(
        area => area.name === region.dongName,
      );

      if (!known) {
        setErrorMessage(
          `'${region.dongName}'은(는) 아직 데이터가 준비된 지역이 아니에요.`,
        );
        return;
      }

      setMatchedDong(known.name);
    } catch (error) {
      console.error('주소 검색 오류:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '주소 검색 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseThisLocation = () => {
    if (!matchedDong) {
      return;
    }

    router.push({
      pathname:
        '/market-analysis/location-recommend-result',
      params: {
        region: matchedDong,
      },
    });
  };

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.category}>
            장기 상권 분석
          </Text>

          <Text style={styles.header}>
            보유 장소 주소 입력
          </Text>

          <Text style={styles.description}>
            주소를 입력하면 해당 위치의 행정동을
            확인해드려요.
          </Text>

          <View style={styles.accentLine} />
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>
            주소
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="예: 세종특별자치시 나성동 123-4"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            <TouchableOpacity
              style={styles.searchButton}
              activeOpacity={0.8}
              onPress={handleSearch}>
              <Text
                style={
                  styles.searchButtonText
                }>
                검색
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingText}>
              주소를 확인하고 있어요
            </Text>
          </View>
        )}

        {!loading &&
          errorMessage !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>
                {errorMessage}
              </Text>
            </View>
          )}

        {!loading && coords && (
          <View style={styles.mapCard}>
            <AddressMap
              latitude={coords.lat}
              longitude={coords.lng}
            />
          </View>
        )}

        {!loading && matchedDong && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>
              인식된 지역
            </Text>

            <Text style={styles.resultText}>
              {matchedDong}
            </Text>

            <TouchableOpacity
              style={styles.analyzeButton}
              activeOpacity={0.8}
              onPress={
                handleUseThisLocation
              }>
              <Text
                style={
                  styles.analyzeButtonText
                }>
                이 지역으로 분석하기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },

  headerSection: {
    marginTop: 12,
    marginBottom: 24,
  },

  category: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },

  header: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },

  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  accentLine: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 14,
  },

  searchCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },

  input: {
    flex: 1,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,

    backgroundColor: COLORS.background,

    paddingHorizontal: 14,
    paddingVertical: 12,

    fontSize: 14,
    color: COLORS.text,
  },

  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,

    paddingHorizontal: 20,

    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  loadingBox: {
    marginTop: 30,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  errorBox: {
    marginTop: 16,

    padding: 14,

    borderRadius: 12,

    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFDADA',
  },

  error: {
    color: '#D14343',
    fontSize: 13,
  },

  mapCard: {
    marginTop: 16,

    borderRadius: 16,
    overflow: 'hidden',

    backgroundColor: COLORS.surface,
  },

  resultBox: {
    marginTop: 16,

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: '#D8F5E2',

    borderRadius: 16,
    padding: 18,

    alignItems: 'center',
  },

  resultLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  resultText: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },

  analyzeButton: {
    width: '100%',

    backgroundColor: COLORS.neonLime,

    borderRadius: 12,

    paddingVertical: 14,

    alignItems: 'center',
  },

  analyzeButtonText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 15,
  },
});